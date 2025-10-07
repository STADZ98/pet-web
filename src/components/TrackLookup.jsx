import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Try to load local carrier logos (best-effort)
let carrierLogos = {};
try {
  if (
    typeof import.meta !== "undefined" &&
    typeof import.meta.globEager === "function"
  ) {
    const imgs = import.meta.globEager("./card/images/*.{png,jpg,jpeg,svg}");
    carrierLogos = Object.entries(imgs).reduce((acc, [p, m]) => {
      const name = p.split("/").pop();
      acc[name] = m.default || m;
      return acc;
    }, {});
  }
} catch {
  // ignore - best-effort logo loading
}

// normalize helper (used to match filenames to carrier names)
const _normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9ก-๙]+/g, "")
    .trim();

const findLogoFor = (name) => {
  if (!name) return null;
  const target = _normalize(name);
  const keys = Object.keys(carrierLogos || {});

  // exact-ish filename matches first (filename without extension)
  for (const k of keys) {
    const base = k.replace(/\.[^.]+$/, "");
    if (_normalize(base) === target) return carrierLogos[k];
  }

  // try direct substring/partial matches
  for (const k of keys) {
    const base = k.replace(/\.[^.]+$/, "");
    const nk = _normalize(base);
    if (nk.includes(target) || target.includes(nk)) return carrierLogos[k];
  }

  // keyword aliases: try common carrier keywords to match filenames
  const keywordMap = [
    {
      keys: ["flash", "flash express", "flashexp"],
      candidates: ["flash expess", "flash express", "flash-express"],
    },
    {
      keys: ["j&t", "jnt", "j and t"],
      candidates: ["j&t express", "j&t-express", "j&t express.png"],
    },
    { keys: ["kerry"], candidates: ["kerry express", "kerry express.png"] },
    {
      keys: ["ninja", "ninjavan"],
      candidates: ["ninja express", "ninja express.png"],
    },
    {
      keys: ["thailand post", "ไปรษณีย์", "ไปรษณีย์ไทย"],
      candidates: ["ไปรษณีย์ไทย.png"],
    },
  ];

  for (const map of keywordMap) {
    for (const k of map.keys) {
      if (target.includes(_normalize(k))) {
        for (const candidate of map.candidates) {
          if (carrierLogos[candidate]) return carrierLogos[candidate];
          // also try filename without extension
          const cbase = candidate.replace(/\.[^.]+$/, "");
          const foundKey = keys.find(
            (kk) => kk.replace(/\.[^.]+$/, "") === cbase
          );
          if (foundKey) return carrierLogos[foundKey];
        }
      }
    }
  }

  return null;
};

// Known external provider logos (fallbacks when local assets aren't available)
const providerLogoMap = {
  ไปรษณีย์ไทย:
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/Thailand_Post_Logo.svg",
  "Flash Express":
    "https://seeklogo.com/images/F/flash-express-logo-0A0F8E0CF0-seeklogo.com.png",
  "J&T":
    "https://upload.wikimedia.org/wikipedia/commons/6/6e/J%26T_Express_logo.svg",
  Kerry:
    "https://seeklogo.com/images/K/kerry-express-logo-790F8D73C3-seeklogo.com.png",
  "Ninja Van":
    "https://upload.wikimedia.org/wikipedia/commons/0/0e/Ninja_Van_logo.svg",
  DHL: "https://upload.wikimedia.org/wikipedia/commons/d/d5/DHL_Logo.svg",
  FedEx:
    "https://upload.wikimedia.org/wikipedia/commons/7/7a/FedEx_Express.svg",
};

const providerLogoFor = (name) => {
  if (!name) return null;
  // try known local filenames in ./card/images/ first (more reliable)
  try {
    const n = String(name).toLowerCase();
    const candidates = [
      {
        keys: ["flash", "flash express"],
        files: ["flash expess.png", "flash express.png", "flash-express.png"],
      },
      { keys: ["j&t", "jnt"], files: ["j&t express.png", "j&t-express.png"] },
      { keys: ["kerry"], files: ["kerry express.png", "kerry-express.png"] },
      {
        keys: ["ninja", "ninjavan"],
        files: ["ninja express.png", "ninja-express.png"],
      },
      {
        keys: ["ไปรษณีย์", "thailand post", "ไปรษณีย์ไทย"],
        files: ["ไปรษณีย์ไทย.png"],
      },
    ];

    for (const c of candidates) {
      for (const k of c.keys) {
        if (n.includes(k)) {
          for (const f of c.files) {
            try {
              const url = new URL(`./card/images/${f}`, import.meta.url).href;
              if (url) return url;
            } catch {
              // try next filename
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // prefer local/packaged logos (glob) if available
  const local = findLogoFor(name);
  if (local) return local;

  // try to match known provider names (substring match)
  for (const key of Object.keys(providerLogoMap)) {
    if (String(name).toLowerCase().includes(String(key).toLowerCase()))
      return providerLogoMap[key];
  }

  // if name itself looks like a URL, return it
  try {
    const u = String(name).trim();
    if (/^https?:\/\//i.test(u)) return u;
  } catch {
    /* ignore invalid provider name */
  }

  return null;
};

const STATUS_MAP_TH = {
  not_processed: { label: "รอดำเนินการ", color: "bg-gray-200 text-gray-800" },
  pending: { label: "รอดำเนินการ", color: "bg-gray-200 text-gray-800" },
  processing: { label: "กำลังดำเนินการ", color: "bg-blue-200 text-blue-800" },
  shipped: { label: "จัดส่งแล้ว", color: "bg-green-200 text-green-800" },
  delivered: { label: "จัดส่งสำเร็จ", color: "bg-green-500 text-white" },
  returned: { label: "ส่งคืน", color: "bg-red-200 text-red-800" },
  cancelled: { label: "ยกเลิก", color: "bg-red-500 text-white" },
  unknown: { label: "ไม่ทราบสถานะ", color: "bg-gray-500 text-white" },
};

// Robust image resolver: accept many shapes (string url, relation arrays, JSON strings)
function resolveImageFromItem(item) {
  if (!item) return null;

  const product = item.product || item.productInfo || item.productData || {};
  const variant = item.variant || item.selectedVariant || {};

  const pushIf = (arr, v) => {
    if (!v && v !== 0) return;
    if (typeof v === "string" && v.trim()) arr.push(v.trim());
    else if (typeof v === "object") arr.push(v);
  };

  const candidates = [];

  // direct fields on item
  pushIf(candidates, item.image || item.img || item.picture || item.photo);
  // variant direct
  pushIf(candidates, variant.image || variant.images);
  // product direct
  pushIf(candidates, product.image || product.images);

  // helper to extract url-like from array/object
  const extractUrl = (v) => {
    if (!v) return null;
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v.length > 0) {
      const first = v[0];
      if (!first) return null;
      return (
        first.secure_url ||
        first.url ||
        first.src ||
        (typeof first === "string" ? first : null)
      );
    }
    if (typeof v === "object") return v.secure_url || v.url || v.src || null;
    return null;
  };

  // also handle case where product.images is JSON string
  if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images);
      pushIf(candidates, parsed);
    } catch {
      // ignore
    }
  }
  if (typeof variant.images === "string") {
    try {
      const parsed = JSON.parse(variant.images);
      pushIf(candidates, parsed);
    } catch {
      // ignore
    }
  }

  // flatten candidates and return first url-like
  for (const c of candidates) {
    const url = extractUrl(c);
    if (url) return url;
  }

  return null;
}

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtMoney(n) {
  if (n == null) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(n);
}

export default function TrackLookup({ apiBase = "/api" }) {
  const location = useLocation();
  const initialTrackingFromQuery = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get("tracking") || "";
    } catch {
      return "";
    }
  }, [location.search]);

  const [tracking, setTracking] = useState(initialTrackingFromQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const trackingLabel = useMemo(() => tracking.trim(), [tracking]);

  async function doLookup() {
    if (!trackingLabel) return setError("กรุณากรอกรหัสติดตาม");
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(
        `${apiBase}/shipping/lookup?tracking=${encodeURIComponent(
          trackingLabel
        )}`
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || JSON.stringify(data));
      // server returns { ok: true, order: {...}, events: [...] }
      // normalize to the shape this component expects (result.order, result.events)
      const normalized = {
        trackingId: data.order?.trackingCode || trackingLabel,
        updatedAt:
          data.events?.[0]?.time ||
          data.order?.updatedAt ||
          data.order?.createdAt ||
          null,
        status: data.events?.[0]?.status || data.order?.orderStatus || null,
        shipping: {
          provider:
            data.order?.trackingCarrier || data.order?.trackingCarrier || null,
          service: null,
        },
        shippingAddress: data.order?.address || null,
        order: {
          // Accept both shapes: `products` (older) and `orderItems`/`items` (other APIs)
          orderItems:
            (data.order &&
              (data.order.products ||
                data.order.orderItems ||
                data.order.items)) ||
            [],
          total: data.order?.cartTotal || data.order?.total || null,
        },
        events: data.events || null,
      };
      setResult(normalized);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialTrackingFromQuery) {
      doLookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrackingFromQuery]);

  function _clearAll() {
    setTracking("");
    setResult(null);
    setError(null);
  }

  function _copyTracking() {
    if (!trackingLabel) return;
    try {
      navigator.clipboard?.writeText(trackingLabel);
      const el = document.createElement("div");
      el.textContent = "คัดลอกรหัสติดตามแล้ว!";
      el.className =
        "fixed bottom-6 right-6 bg-gray-800 text-white px-4 py-2 rounded shadow-lg text-sm";
      document.body.appendChild(el);
      // use remove() which doesn't throw if the node was already removed
      setTimeout(() => el.remove(), 1800);
    } catch {
      // ignore clipboard errors
    }
  }

  function mapStatus(raw) {
    if (!raw) return STATUS_MAP_TH.unknown;
    const key = String(raw).toLowerCase();
    return (
      STATUS_MAP_TH[key] || { label: raw, color: "bg-gray-200 text-gray-800" }
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-6">
          ตรวจสอบสถานะพัสดุ
        </h2>

        {/* Search Input Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>
              <input
                id="tracking"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                className="w-full border border-transparent rounded-xl pl-12 pr-4 py-3 bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                placeholder="ใส่รหัสติดตาม เช่น ORD-20250920-000001"
                onKeyDown={(e) => {
                  if (e.key === "Enter") doLookup();
                }}
                aria-label="รหัสติดตาม"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={doLookup}
                disabled={loading}
              >
                {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบ"}
              </button>
              {/* <button
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition"
                onClick={clearAll}
                title="ล้างผลลัพธ์"
              >
                ล้าง
              </button> */}
              {/* <button
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition"
                onClick={copyTracking}
                title="คัดลอกรหัสติดตาม"
              >
                คัดลอกกกก
              </button> */}
            </div>
          </div>
          {error && (
            <div className="mt-3 text-sm text-red-600 text-center">{error}</div>
          )}
        </div>

        {/* Result Display */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 rounded-lg p-4 text-center">
            <p className="font-bold">เกิดข้อผิดพลาด</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            {/* Main Status Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500">รหัสติดตาม</p>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {result.trackingId}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    อัปเดตล่าสุด: {fmtDate(result.updatedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">สถานะปัจจุบัน</p>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      mapStatus(result.status).color
                    }`}
                  >
                    {mapStatus(result.status).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping and Product Details */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column: Shipping Provider & Address */}
              <div className="md:col-span-1 space-y-6">
                {/* Shipping Provider */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">
                    ผู้ให้บริการขนส่ง
                  </h4>
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        providerLogoFor(result.shipping?.provider) ||
                        // inline blank SVG data URI placeholder (no external DNS)
                        `data:image/svg+xml;utf8,${encodeURIComponent(
                          '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="100%" height="100%" fill="%23f3f4f6"/></svg>'
                        )}`
                      }
                      alt={result.shipping?.provider || "ผู้ให้บริการ"}
                      className="w-12 h-12 object-contain rounded-md bg-gray-100 p-1"
                      onError={(e) => {
                        try {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                            '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="100%" height="100%" fill="%23f3f4f6"/></svg>'
                          )}`;
                        } catch {
                          /* ignore image swap errors */
                        }
                      }}
                    />
                    <div>
                      <p className="font-semibold text-gray-700">
                        {result.shipping?.provider || "ไม่ระบุ"}
                      </p>
                      <p className="text-sm text-gray-500">
                        ประเภท: {result.shipping?.service || "ส่งแบบปกติ"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">
                    ที่อยู่สำหรับจัดส่ง
                  </h4>
                  {result.shippingAddress ? (
                    <div className="space-y-1 text-gray-600 text-sm">
                      <p>{result.shippingAddress.name}</p>
                      <p>{result.shippingAddress.address}</p>
                      <p>
                        {result.shippingAddress.city}{" "}
                        {result.shippingAddress.province}{" "}
                        {result.shippingAddress.postalCode}
                      </p>
                      <p>
                        โทร:{" "}
                        {result.shippingAddress.phone ||
                          result.shippingAddress.telephone ||
                          result.shippingAddress.tel ||
                          result.shippingAddress.mobile ||
                          "-"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">ไม่พบข้อมูลที่อยู่</p>
                  )}
                </div>
              </div>

              {/* Right Column: Order Items */}
              <div className="md:col-span-2">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <div className="p-6">
                    <h4 className="text-lg font-bold text-gray-800">
                      รายการสินค้า ({result.order?.orderItems?.length || 0}{" "}
                      รายการ)
                    </h4>
                  </div>
                  <div className="border-t border-gray-200">
                    {result.order?.orderItems?.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {result.order.orderItems
                          .slice(0, 2)
                          .map((item, index) => {
                            // normalize fields across different API shapes
                            const product =
                              item.product ||
                              item.productInfo ||
                              item.productData ||
                              {};
                            const variant =
                              item.variant || item.selectedVariant || {};
                            // title: show main product and sub-product (variant) when available
                            const productTitle =
                              product.title ||
                              product.name ||
                              item.title ||
                              item.name ||
                              "ไม่ระบุชื่อสินค้า";
                            const variantTitle =
                              variant.title || variant.name || null;
                            const title = variantTitle
                              ? `${productTitle} - ${variantTitle}`
                              : productTitle;
                            // price: try item.price -> variant.price -> product.price -> 0
                            const price =
                              item.price ?? variant.price ?? product.price ?? 0;
                            // count/quantity: support `count`, `quantity`, `qty`
                            const count =
                              item.count ?? item.quantity ?? item.qty ?? 1;
                            // image: try variant.image, product.image, product.images[0].url
                            // prefer secure_url/url from related Image/VariantImage records
                            const resolved = resolveImageFromItem(item);
                            const image =
                              resolved ||
                              variant.image ||
                              product.image ||
                              // inline placeholder 80x80 (small gray square)
                              `data:image/svg+xml;utf8,${encodeURIComponent(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="%23f3f4f6"/></svg>'
                              )}`;

                            return (
                              <li key={index} className="p-4 flex gap-4">
                                <img
                                  src={image}
                                  alt={title}
                                  className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                                  onError={(e) => {
                                    try {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="%23f3f4f6"/></svg>'
                                      )}`;
                                    } catch {
                                      /* ignore image swap errors */
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800">
                                    {title}
                                  </p>

                                  <p className="text-sm text-gray-500">
                                    จำนวน: {count}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-700">
                                    {fmtMoney(price * (count || 0))}
                                  </p>
                                  <p className="text-sm text-gray-500 line-through">
                                    {fmtMoney(
                                      product.originalPrice ||
                                        product.listPrice ||
                                        null
                                    )}
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                        {result.order.orderItems.length > 2 && (
                          <li className="p-4 text-center text-sm text-gray-500">
                            + และอีก {result.order.orderItems.length - 2} รายการ
                          </li>
                        )}
                      </ul>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <p className="mb-2">ไม่พบรายการสินค้าในคำสั่งซื้อนี้</p>
                        <p className="text-sm">
                          ถ้าคุณคาดว่าจะเห็นรายการสินค้า
                          ให้ตรวจสอบว่ารหัสติดตามเชื่อมโยงกับคำสั่งซื้อหรือเรียกดูคำสั่งซื้อผ่านหน้าโปรไฟล์
                          (ต้องเข้าสู่ระบบ)
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-b-2xl p-6 border-t border-gray-200">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>ยอดรวมสุทธิ</span>
                      <span>{fmtMoney(result.order?.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
