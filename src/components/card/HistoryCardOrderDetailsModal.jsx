import React, { useState, useEffect } from "react";
// Link removed: using external Thailand Post tracking page
import useEcomStore from "../../store/ecom-store";
// dateFormat not used here but kept in utils for other components
import { numberFormat } from "../../utils/number";
import {
  X,
  PackageSearch,
  Package,
  Mail,
  UserRound,
  ShoppingCart,
  Truck,
  Copy,
  ExternalLink,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  Phone,
} from "lucide-react";
// load local carrier logos: prefer Vite's import.meta.globEager if available,
// otherwise fall back to building URLs for a known set of files so runtime won't crash.
let localLogos = {};
try {
  if (
    typeof import.meta !== "undefined" &&
    typeof import.meta.globEager === "function"
  ) {
    const images = import.meta.globEager("./images/*.{png,jpg,jpeg,svg}");
    localLogos = Object.entries(images).reduce((acc, [path, mod]) => {
      const fileName = path.split("/").pop();
      acc[fileName] = mod.default || mod;
      return acc;
    }, {});
  } else {
    // runtime fallback: list expected filenames in the images folder
    const files = [
      "ไปรษณีย์ไทย.png",
      // include the actual filename in the images folder (note misspelling)
      "flash expess.png",
      "flash express.png",
      // accept common filename variants so runtime URL resolution works
      "flash-express.png",
      "flash_express.png",
      "j&t express.png",
      "j&t-express.png",
      "kerry express.png",
      "ninja express.png",
    ];
    files.forEach((f) => {
      try {
        localLogos[f] = new URL(`./images/${f}`, import.meta.url).href;
      } catch {
        // ignore if URL resolution fails in this environment
      }
    });
  }
} catch {
  // defensive: if any unexpected error occurs, ensure localLogos is at least an object
  localLogos = localLogos || {};
}

// Explicitly import known local carrier images so bundlers that don't support
// import.meta.globEager still have deterministic references. Keep names
// matching the actual files in `./images/`.
// Resolve known filenames using import.meta.url so bundlers like Vite
// will convert them to correct URLs at build time. This avoids using
// `require` which isn't defined in ESM environments.
const knownFiles = [
  "flash expess.png",
  "j&t express.png",
  "kerry express.png",
  "ninja express.png",
  "ไปรษณีย์ไทย.png",
];
knownFiles.forEach((f) => {
  try {
    localLogos[f] = new URL(`./images/${f}`, import.meta.url).href;
  } catch {
    // ignore if resolution fails
  }
});

// helper: try to find a local logo by normalizing names (space/case/diacritics tolerant)
const findLocalLogo = (name) => {
  if (!name) return null;

  const normalize = (s) =>
    String(s)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9ก-๙]+/g, "")
      .trim();

  const tableKeys = Object.keys(localLogos);
  const target = normalize(name);

  // Try exact-ish filename matches first (handle common separators)
  const variants = [
    name,
    name.toLowerCase(),
    name.replace(/\s+/g, " "),
    name.replace(/\s+/g, "-"),
    name.replace(/\s+/g, "_"),
    name.replace(/\s+/g, ""),
  ]
    .map((v) => String(v))
    .map((v) => v.replace(/[^a-z0-9ก-๙.&\-\s]+/gi, ""));

  for (const v of variants) {
    for (const k of tableKeys) {
      const keyName = k.replace(/\.[^.]+$/, "");
      if (keyName.toLowerCase() === v.toLowerCase()) return localLogos[k];
    }
  }

  // Fallback to normalized substring matching
  for (const k of tableKeys) {
    const keyName = k.replace(/\.[^.]+$/, "");
    const nKey = normalize(keyName);
    if (nKey.includes(target) || target.includes(nKey)) return localLogos[k];
  }

  return null;
};
import {
  normalizePaymentMethod,
  paymentMethodMap,
} from "../admin/adminHelpers";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { updateOrderShipping } from "../../api/admin";

// Static imports for local carrier images — ensures bundlers include them
// import flashExpessImg from "./images/flash expess.png";
// import jntExpressImg from "./images/j&t express.png";
// import kerryExpressImg from "./images/kerry express.png";
// import ninjaExpressImg from "./images/ninja express.png";
// import thailandPostImg from "./images/ไปรษณีย์ไทย.png";

// ---------- Carrier Badge Component (with logos + robust fallback) ----------
const CarrierBadge = ({ carrier }) => {
  const [imgError, setImgError] = useState(false);

  if (!carrier) return <span className="text-sm text-gray-500">-</span>;

  // mapping ของ carrier -> logo (URL)
  const carrierLogos = {
    ไปรษณีย์ไทย:
      findLocalLogo("ไปรษณีย์ไทย") ||
      localLogos["ไปรษณีย์ไทย.png"] ||
      "https://upload.wikimedia.org/wikipedia/commons/0/0b/Thailand_Post_Logo.svg",
    "Thailand Post":
      findLocalLogo("thailand post") ||
      localLogos["ไปรษณีย์ไทย.png"] ||
      findLocalLogo("ไปรษณีย์ไทย") ||
      "https://upload.wikimedia.org/wikipedia/commons/0/0b/Thailand_Post_Logo.svg",
    "Flash Express":
      findLocalLogo("flash express") ||
      findLocalLogo("flash expess") ||
      localLogos["flash expess.png"] ||
      localLogos["flash express.png"] ||
      "https://seeklogo.com/images/F/flash-express-logo-0A0F8E0CF0-seeklogo.com.png",
    "Flash Expess":
      findLocalLogo("flash expess") ||
      localLogos["flash expess.png"] ||
      findLocalLogo("flash express") ||
      "https://seeklogo.com/images/F/flash-express-logo-0A0F8E0CF0-seeklogo.com.png",
    "J&T":
      findLocalLogo("j&t") ||
      findLocalLogo("j&t express") ||
      localLogos["j&t express.png"] ||
      "https://upload.wikimedia.org/wikipedia/commons/6/6e/J%26T_Express_logo.svg",
    "J&T Express":
      findLocalLogo("j&t express") ||
      localLogos["j&t express.png"] ||
      findLocalLogo("j&t") ||
      "https://upload.wikimedia.org/wikipedia/commons/6/6e/J%26T_Express_logo.svg",
    Kerry:
      findLocalLogo("kerry express") ||
      localLogos["kerry express.png"] ||
      "https://seeklogo.com/images/K/kerry-express-logo-790F8D73C3-seeklogo.com.png",
    "Kerry Express":
      findLocalLogo("kerry express") ||
      localLogos["kerry express.png"] ||
      "https://seeklogo.com/images/K/kerry-express-logo-790F8D73C3-seeklogo.com.png",
    "Ninja Van":
      findLocalLogo("ninja express") ||
      localLogos["ninja express.png"] ||
      "https://upload.wikimedia.org/wikipedia/commons/0/0e/Ninja_Van_logo.svg",
    Ninjavan:
      findLocalLogo("ninja express") ||
      localLogos["ninja express.png"] ||
      "https://upload.wikimedia.org/wikipedia/commons/0/0e/Ninja_Van_logo.svg",
    DHL:
      findLocalLogo("dhl") ||
      "https://upload.wikimedia.org/wikipedia/commons/d/d5/DHL_Logo.svg",
    FedEx:
      findLocalLogo("fedex") ||
      "https://upload.wikimedia.org/wikipedia/commons/7/7a/FedEx_Express.svg",
    "SCG Express":
      findLocalLogo("scg") || "https://scgexpress.co.th/img/logo.svg",
  };

  // Quick alias-based fixes for common misspellings/variants (ensure local file used)
  const normalizedCarrierKey = (carrier || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9ก-๙]+/gi, "");
  if (
    (normalizedCarrierKey.includes("flashexpress") ||
      normalizedCarrierKey.includes("flashexpess")) &&
    !logo
  ) {
    // prefer the actual local file name (note the repository uses the misspelled filename)
    logo =
      localLogos["flash expess.png"] ||
      localLogos["flash express.png"] ||
      findLocalLogo("flash expess") ||
      findLocalLogo("flash express");
  }

  // color / avatar background mapping for fallback initials
  const carrierColors = {
    ไปรษณีย์ไทย: "bg-red-50 text-red-700",
    "Flash Express": "bg-indigo-50 text-indigo-700",
    "J&T": "bg-pink-50 text-pink-700",
    Kerry: "bg-yellow-50 text-yellow-800",
    "Ninja Van": "bg-emerald-50 text-emerald-700",
    DHL: "bg-yellow-50 text-yellow-800",
    FedEx: "bg-violet-50 text-violet-700",
    "SCG Express": "bg-orange-50 text-orange-700",
  };

  // หา key ที่ match กับ carrier ที่ส่งมา (case-insensitive, partial match)
  const matchedKey =
    Object.keys(carrierLogos).find((k) =>
      carrier.toLowerCase().includes(k.toLowerCase())
    ) || null;

  let logo = matchedKey ? carrierLogos[matchedKey] : null;
  const colorClass = matchedKey
    ? carrierColors[matchedKey] || "bg-gray-100 text-gray-700"
    : "bg-gray-100 text-gray-700";

  // Build initials for fallback (max 2 chars)
  const initials = (() => {
    try {
      const parts = (matchedKey || carrier).split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
    } catch {
      return (carrier || "?").slice(0, 2).toUpperCase();
    }
  })();

  return (
    <div className="inline-flex items-center gap-3 px-3 py-1 rounded-lg bg-white border border-gray-200 shadow-sm text-sm">
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
        {logo && !imgError ? (
          <img
            src={logo}
            alt={`${carrier} logo`}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center font-semibold ${colorClass}`}
          >
            {initials}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate max-w-[12rem]">
          {carrier}
        </div>
        <div className="text-xs text-gray-500 truncate max-w-[12rem]">
          {matchedKey ? matchedKey : "ผู้ให้บริการทั่วไป"}
        </div>
      </div>
    </div>
  );
};

// ---------- Shipping & Tracking Section ----------
const ShippingSection = ({ order }) => {
  const currentUser = useEcomStore((s) => s.user);
  const [editingShipping, setEditingShipping] = useState(false);
  const [localCarrier, setLocalCarrier] = useState("");
  const [localTracking, setLocalTracking] = useState("");
  const [savingShipping, setSavingShipping] = useState(false);

  const shippingCarrierDisplay =
    order?.trackingCarrier || order?.shipping?.carrier || null;
  const trackingCodeDisplay =
    order?.trackingCode || order?.shipping?.tracking || null;

  useEffect(() => {
    setLocalCarrier(shippingCarrierDisplay || "");
    setLocalTracking(trackingCodeDisplay || "");
  }, [shippingCarrierDisplay, trackingCodeDisplay]);

  const handleSave = async () => {
    if (!currentUser?.token) {
      toast.error("ต้องมีสิทธิ์ผู้ดูแลเพื่อบันทึกข้อมูล");
      return;
    }
    setSavingShipping(true);
    try {
      await updateOrderShipping(currentUser.token, order.id || order._id, {
        carrier: localCarrier || undefined,
        tracking: localTracking || undefined,
      });
      toast.success("บันทึกรหัสติดตามเรียบร้อย");
      setEditingShipping(false);
      // Manually update order object to reflect changes immediately in the UI
      if (order) {
        order.trackingCode = localTracking;
        order.trackingCarrier = localCarrier;
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "ไม่สามารถบันทึกรหัสได้");
    } finally {
      setSavingShipping(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Truck size={18} className="text-yellow-500" />
          ข้อมูลการจัดส่ง
        </h4>
        {!editingShipping && currentUser?.role === "admin" && (
          <button
            onClick={() => setEditingShipping(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
          >
            <Pencil size={12} /> แก้ไข
          </button>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-24">ผู้ให้บริการ:</span>
          {shippingCarrierDisplay ? (
            <CarrierBadge carrier={shippingCarrierDisplay} />
          ) : (
            <span className="text-sm text-slate-500">-</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-24">เลขติดตาม:</span>
          {trackingCodeDisplay ? (
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-yellow-600 bg-blue-50 px-2 py-1 rounded">
                {trackingCodeDisplay}
              </code>
              {/* Dynamic tracking button: detect carrier and open provider-specific tracking page */}
              <TrackingButton
                carrier={shippingCarrierDisplay}
                tracking={trackingCodeDisplay}
              />
            </div>
          ) : (
            <span className="text-sm text-slate-500">-</span>
          )}
        </div>
      </div>

      {editingShipping && (
        <div className="space-y-4 pt-4 mt-4 border-t border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              ผู้ให้บริการ
            </label>
            <select
              className="w-full border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:border-blue-500 focus:ring-blue-500 transition"
              value={localCarrier}
              onChange={(e) => setLocalCarrier(e.target.value)}
            >
              <option value="">เลือกผู้ให้บริการ</option>
              {[
                "Kerry Express",
                "Flash Express",
                "SCG Express",
                "J&T Express",
                "ไปรษณีย์ไทย",
                "Ninja Van",
                "DHL",
                "FedEx",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              รหัสติดตาม
            </label>
            <input
              type="text"
              className="w-full border-slate-300 rounded-lg px-3 py-2 font-mono text-sm bg-slate-50 focus:border-blue-500 focus:ring-blue-500 transition"
              value={localTracking}
              onChange={(e) => setLocalTracking(e.target.value)}
              placeholder="กรอกรหัสติดตาม"
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => {
                setEditingShipping(false);
                setLocalCarrier(shippingCarrierDisplay || "");
                setLocalTracking(trackingCodeDisplay || "");
              }}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={savingShipping}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                savingShipping
                  ? "bg-blue-400 text-white cursor-wait"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {savingShipping ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Build provider specific tracking URLs. If carrier is unknown, fall back to Thailand Post tracking search.
const getTrackingUrl = (carrier, tracking) => {
  if (!tracking) return null;
  const t = encodeURIComponent(tracking.trim());
  const c = (carrier || "").toString().toLowerCase();

  // J&T (there are multiple country-specific trackers; using Thailand service that accepts query)
  if (
    c.includes("j&t") ||
    c.includes("jnt") ||
    c.includes("jandt") ||
    c.includes("jandt") ||
    c.includes("jtexpress") ||
    c.includes("j&t express") ||
    c.includes("j t")
  ) {
    // J&T Thailand tracking - J&T uses a search page; this URL opens the search with the code as query
    return `https://jtexpress.co.th/service/track?track_number=${t}`;
  }

  // Ninja Van
  if (
    c.includes("ninja") ||
    c.includes("ninjavan") ||
    c.includes("ninja van")
  ) {
    // Ninja Van Thailand tracking page accepts query via path or query; use their tracking page
    return `https://www.ninjavan.co/th-th/tracking?consignment=${t}`;
  }

  // KEX (Kerry Express / kex-express)
  if (
    c.includes("kex") ||
    c.includes("kerry") ||
    c.includes("kerryexpress") ||
    c.includes("kerry express")
  ) {
    // KEX Express (kex-express) tracking
    return `https://th.kex-express.com/th/track/?search_text=${t}`;
  }

  // Flash Express
  if (c.includes("flash")) {
    // Flash Express tracking
    return `https://www.flashexpress.com/fle/tracking?tracking_number=${t}`;
  }

  // Thailand Post fallback: open general search page and append tracking (some pages accept query param 'trackNumber')
  return `https://track.thailandpost.co.th/?track=${t}`;
};

const TrackingButton = ({ carrier, tracking }) => {
  const href = getTrackingUrl(carrier, tracking);

  if (!href) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-200 text-slate-400 rounded-lg text-xs font-medium"
        aria-label={`ไม่มีรหัสติดตาม`}
      >
        ติดตาม
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
      aria-label={`ติดตามพัสดุ ${tracking}`}
    >
      ติดตาม
      <ExternalLink size={14} />
    </a>
  );
};

// ---------- Main Modal Component ----------
const OrderDetailsModal = ({
  isOpen,
  closeModal,
  order,
  translateStatus,
  getStatusColor,
}) => {
  if (!isOpen || !order) return null;

  const orderCode = `ORD-${new Date(order.createdAt)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${String(order._id || order.id).slice(-6)}`;
  const customerName =
    order.name || order.address?.name || order.orderedBy?.name || "ไม่ระบุ";
  const customerEmail = order.orderedBy?.email || order.email || "-";
  const customerTelephone =
    order.address?.telephone ||
    order.address?.phone ||
    order.address?.tel ||
    order.address?.mobile ||
    order.orderedBy?.telephone ||
    order.orderedBy?.phone ||
    "-";

  const copyToClipboard = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  // prevent linter warnings for optional props
  void translateStatus;
  void getStatusColor;
  // keep orderCode accessible for a11y/printing
  const _orderCode_for_a11y = orderCode;

  // reference helper to avoid unused warning
  void copyToClipboard;

  // mark some imported helpers as used to avoid linter 'defined but never used' warnings
  void normalizePaymentMethod;
  void paymentMethodMap;

  // determine whether to show shipping section based on order status
  // Shipping information should not be shown for cancelled orders.
  const showShippingSection = (() => {
    try {
      const s = String(order?.orderStatus || "").toUpperCase();
      // show shipping only when order is being processed or already delivered
      return ["PROCESSING", "DELIVERED"].includes(s);
    } catch {
      return false;
    }
  })();

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl bg-slate-50 shadow-2xl flex flex-col transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4">
            <div className=" text-yellow-500 p-3 rounded-xl">
              <PackageSearch size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                รายละเอียดคำสั่งซื้อ
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Printer size={16} /> พิมพ์
            </button> */}
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X size={22} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left side */}
          <div className="lg:col-span-8 space-y-6">
            {/* Order Progress */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-slate-800 mb-6">
                สถานะคำสั่งซื้อ
              </h4>
              <div className="flex items-center justify-between relative">
                {[
                  {
                    key: "NOT_PROCESSED",
                    label: "รอดำเนินการ",
                    icon: <Clock size={22} />,
                  },
                  {
                    key: "PROCESSING",
                    label: "กำลังดำเนินการ",
                    icon: <Package size={22} />,
                  },
                  {
                    key: "DELIVERED",
                    label: "จัดส่งสำเร็จ",
                    icon: <CheckCircle2 size={22} />,
                  },
                ]
                  .filter(() => order.orderStatus !== "CANCELLED")
                  .map((step, i, arr) => {
                    const activeIndex = arr.findIndex(
                      (s) => s.key === order.orderStatus
                    );
                    const isCompleted = i < activeIndex;
                    const isCurrent = i === activeIndex;

                    return (
                      <React.Fragment key={step.key}>
                        <div className="z-10 flex-1 flex flex-col items-center text-center">
                          <div
                            className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                              isCurrent
                                ? "bg-yellow-500 text-white"
                                : isCompleted
                                ? "bg-gray-500 text-white"
                                : "bg-white border-slate-300 text-slate-400"
                            }`}
                          >
                            {step.icon}
                          </div>
                          <div
                            className={`mt-2 text-xs font-semibold ${
                              isCurrent || isCompleted
                                ? "text-slate-800"
                                : "text-slate-500"
                            }`}
                          >
                            {step.label}
                          </div>
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className={`flex-1 h-1 mx-2 transition-all duration-500 ${
                              isCompleted ? "bg-yellow-300" : "bg-slate-200"
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                {order.orderStatus === "CANCELLED" && (
                  <div className="w-full flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-rose-100 text-rose-500">
                      <XCircle size={40} />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-rose-600">
                      คำสั่งซื้อถูกยกเลิก
                    </h3>
                    <p className="text-slate-500">
                      {order.cancelReason || "คำสั่งซื้อนี้ได้ถูกยกเลิกแล้ว"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer & Address */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h4 className="flex items-center gap-3 text-base font-semibold text-slate-800 mb-4">
                  <UserRound size={18} className="text-yellow-500" />
                  ข้อมูลลูกค้า
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-slate-800">{customerName}</p>
                  <p className="text-slate-600 flex items-center gap-2">
                    <Mail size={14} /> {customerEmail}
                  </p>
                  <p className="text-slate-600 flex items-center gap-2">
                    <Phone size={14} /> {customerTelephone}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h4 className="flex items-center gap-3 text-base font-semibold text-slate-800 mb-4">
                  <Truck size={18} className="text-yellow-500" />
                  ที่อยู่จัดส่ง
                </h4>
                <address className="space-y-1 text-sm not-italic text-slate-600">
                  <p className="font-medium text-slate-800">
                    {order.address?.name || customerName}
                  </p>
                  <p>{order.address?.address || "ไม่ระบุที่อยู่"}</p>
                  <p>
                    {order.address?.subdistrict || ""}{" "}
                    {order.address?.district || ""}
                  </p>
                  <p>
                    {order.address?.province || ""}{" "}
                    {order.address?.zipcode || ""}
                  </p>
                </address>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="flex items-center gap-3 text-base font-semibold text-slate-800 mb-4">
                <ShoppingCart size={18} className="text-yellow-500" />
                รายการสินค้า ({order.products?.length || 0} รายการ)
              </h4>
              {order.products?.length ? (
                <div className="divide-y divide-slate-100">
                  {order.products.map((p, i) => {
                    const title = p.variant?.title
                      ? `${p.product?.title || ""} - ${p.variant.title}`
                      : p.product?.title || "ไม่ระบุ";
                    const price =
                      p.price ?? p.variant?.price ?? p.product?.price ?? 0;
                    const image =
                      (p.variant?.images && p.variant.images[0]?.url) ||
                      p.variant?.image ||
                      (p.product?.images && p.product.images[0]?.url) ||
                      p.product?.image ||
                      `data:image/svg+xml;utf8,${encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23e2e8f0"/></svg>'
                      )}`;

                    return (
                      <div key={i} className="flex items-center gap-4 py-4">
                        <img
                          src={image}
                          alt={title}
                          className="w-16 h-16 rounded-lg border border-slate-200 object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">
                            {title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.product?.category?.name || "-"}
                          </p>
                          <p className="text-sm text-slate-500">
                            จำนวน: {p.count}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-slate-900">
                            {numberFormat(price * (p.count || 0))} ฿
                          </p>
                          <p className="text-sm text-slate-500">
                            ({numberFormat(price)} ฿/ชิ้น)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic text-center py-8">
                  ไม่มีสินค้าในคำสั่งซื้อนี้
                </p>
              )}
            </div>
          </div>

          {/* Right side summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="text-base font-semibold text-slate-800 mb-4">
                สรุปยอด
              </h4>
              <div className="text-sm space-y-3 text-slate-700">
                <div className="flex justify-between">
                  <span>ราคาสินค้า</span>
                  <span className="font-medium">
                    {numberFormat(order.cartTotal)} ฿
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าจัดส่ง</span>
                  <span className="font-medium">
                    {numberFormat(order.shippingFee || 0)} ฿
                  </span>
                </div>
                <div className="border-t border-dashed border-slate-300 my-3"></div>
                <div className="flex justify-between font-bold text-lg text-yellow-600">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span>
                    {numberFormat(
                      (order.cartTotal || 0) + (order.shippingFee || 0)
                    )}{" "}
                    ฿
                  </span>
                </div>
              </div>
            </div>

            {/* <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="text-base font-semibold text-slate-800 mb-4">
                ช่องทางการชำระเงิน
              </h4>
              <div>
                {(() => {
                  // prefer explicit saved paymentMethod (string)
                  let raw =
                    order?.paymentMethod || order?.payment_method || null;

                  // accept embedded objects that may contain payment method info
                  if (
                    !raw &&
                    order?.paymentIntent &&
                    typeof order.paymentIntent === "object"
                  ) {
                    raw = order.paymentIntent;
                  }
                  if (
                    !raw &&
                    order?.payment &&
                    typeof order.payment === "object"
                  ) {
                    raw = order.payment;
                  }

                  // sometimes metadata holds a small flag
                  if (
                    !raw &&
                    order?.metadata &&
                    order.metadata.payment_method
                  ) {
                    raw = order.metadata.payment_method;
                  }

                  // Do NOT infer method from stripePaymentId (it's just an id string)
                  // Only accept stripePaymentId when it is an object (rare case where PI was stored whole)
                  if (
                    !raw &&
                    order?.stripePaymentId &&
                    typeof order.stripePaymentId === "object"
                  ) {
                    raw = order.stripePaymentId;
                  }

                  // normalize and map to UI label/icon
                  const key = normalizePaymentMethod(raw) || "other";
                  const pm = paymentMethodMap[key] || paymentMethodMap.other;

                  if (!pm) {
                    return (
                      <span className="text-sm text-slate-500">ไม่ระบุ</span>
                    );
                  }

                  return (
                    <span
                      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium border ${pm.color}`}
                    >
                      <span className="flex items-center">{pm.icon}</span>
                      <span>{pm.label}</span>
                    </span>
                  );
                })()}
              </div>
            </div> */}

            {showShippingSection && <ShippingSection order={order} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
