import React, { useEffect, useState } from "react";
import {
  Package,
  User,
  MapPin,
  Phone,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Save,
  Trash2,
  PlusCircle,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { numberFormat } from "../../../utils/number";
import { updateOrderShipping, generateAdminTracking } from "../../../api/admin";
import { toast } from "react-toastify";

// Reusable components to improve readability and style
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ease-in-out
      ${
        active
          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
  >
    {children}
  </button>
);

const InfoCard = ({ icon, title, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
    <div className="flex items-center gap-3 text-gray-500">
      {icon}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const TrackingResultView = ({ result }) => {
  if (!result || !result.events || result.events.length === 0) {
    return (
      <div className="text-sm text-gray-500 flex flex-col items-center justify-center h-24">
        <Clock className="w-6 h-6 mb-2 text-gray-400" />
        <span className="text-center">ไม่พบข้อมูลการติดตามพัสดุ</span>
      </div>
    );
  }
  return (
    <div className="space-y-4 relative pl-4">
      {/* Timeline line */}
      <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200 transform translate-x-1/2 -translate-y-1/2" />
      {result.events.map((event, index) => (
        <div key={index} className="flex gap-4 items-start relative">
          <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 z-10 -ml-2.5 mt-1" />
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium text-gray-900">{event.status}</p>
            <p className="text-xs text-gray-500">{event.location}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(event.timestamp).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function to get product image URL (handle multiple shapes)
const productImageUrl = (p) => {
  if (!p) return "https://placehold.co/56x56";

  // Variant image priority
  const variant = p.variant || {};
  if (variant.image) return variant.image;
  if (Array.isArray(variant.images) && variant.images.length > 0)
    return variant.images[0].url || variant.images[0];

  // Product image fallback
  const prod = p.product || {};
  if (prod.image) return prod.image;
  if (Array.isArray(prod.images) && prod.images.length > 0)
    return prod.images[0].url || prod.images[0];

  // Generic fields
  if (p.image) return p.image;

  return "https://placehold.co/56x56";
};

// Main Component
export default function OrderDetailsModal({
  viewOrder,
  setViewOrder,
  dateFormatTH,
  shippingEdits,
  setShippingEdits,
  copyToClipboard,
  validateTracking,
  handleSaveShippingInfo,
  token,
}) {
  // avoid linter 'defined but never used' for optional callbacks
  void copyToClipboard;
  const [activeTab, setActiveTab] = useState("summary");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localEdits, setLocalEdits] = useState({});
  const [generatedCodes, setGeneratedCodes] = useState(null);
  const [trackingFormats, setTrackingFormats] = useState(null);

  const orderId = viewOrder?.id || viewOrder?._id || null;

  const currentCarrier =
    shippingEdits?.[orderId]?.carrier ??
    localEdits?.carrier ??
    viewOrder?.shipping?.carrier ??
    viewOrder?.trackingCarrier ??
    "";
  const currentTracking =
    shippingEdits?.[orderId]?.tracking ??
    localEdits?.tracking ??
    viewOrder?.shipping?.tracking ??
    viewOrder?.trackingCode ??
    "";

  useEffect(() => {
    setTrackingResult(null);
  }, [orderId]);

  // initialize local edits when order changes or shippingEdits updates
  useEffect(() => {
    const preset = shippingEdits?.[orderId] || {};
    setLocalEdits({
      carrier:
        preset.carrier ??
        viewOrder?.shipping?.carrier ??
        viewOrder?.trackingCarrier ??
        "",
      tracking:
        preset.tracking ??
        viewOrder?.shipping?.tracking ??
        viewOrder?.trackingCode ??
        "",
    });
  }, [orderId, shippingEdits, viewOrder]);

  const handleFieldChange = (field, value) => {
    // update local copy
    setLocalEdits((prev) => ({ ...(prev || {}), [field]: value }));
    // if parent provided setter, update it as well
    if (typeof setShippingEdits === "function") {
      setShippingEdits((prev) => ({
        ...(prev || {}),
        [orderId]: {
          ...(prev?.[orderId] || {}),
          [field]: value,
        },
      }));
    }
    // clear generated suggestions when user edits carrier/tracking
    if (field === "carrier" || field === "tracking") setGeneratedCodes(null);
  };

  const pad9 = (n) => String(n).slice(-9).padStart(9, "0");
  const generateThaiTracking = (seed = "EG") => {
    const s = `${orderId || ""}|${Date.now()}`;
    let h = 0;
    for (let i = 0; i < s.length; i++)
      h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
    return `${seed}${pad9(Math.abs(h) % 1000000000)}TH`;
  };

  // Generate realistic tracking codes per carrier
  const _generateForCarrier = (carrier) => {
    const c = (carrier || "").toString().toLowerCase();
    const rnd = (len) =>
      Array.from({ length: len })
        .map(() => Math.floor(Math.random() * 10))
        .join("");
    const rndLetters = (len) =>
      Array.from({ length: len })
        .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
        .join("");

    if (c.includes("ไปรษณีย์ไทย") || c.includes("thailand")) {
      // Thailand Post: 2 letters + 9 digits + TH
      return `${rndLetters(2)}${rnd(9)}TH`;
    }
    if (c.includes("flash")) {
      // Flash Express: 13 digits
      return `${rnd(13)}`;
    }
    if (c.includes("j&t") || c.includes("jnt") || c.includes("jtexpress")) {
      // J&T: 12 digits
      return `${rnd(12)}`;
    }
    if (c.includes("kerry") || c.includes("kex")) {
      // Kerry: 2 letters + 9 digits
      return `${rndLetters(2)}${rnd(9)}`;
    }
    if (c.includes("ninja")) {
      // Ninja Van: 3 letters + 9 digits
      return `${rndLetters(3)}${rnd(9)}`;
    }
    if (c.includes("dhl")) {
      // DHL Express: 10 digits; DHL eCommerce variant: letter + 11-14 digits
      if (Math.random() > 0.5) return `${rnd(10)}`;
      return `${rndLetters(1)}${rnd(11 + Math.floor(Math.random() * 4))}`;
    }
    if (c.includes("fedex")) {
      // FedEx: 12 or 15 digits
      return Math.random() > 0.5 ? `${rnd(12)}` : `${rnd(15)}`;
    }
    if (c.includes("scg")) {
      // SCG Express: SCG + 10-12 digits
      const n = 10 + Math.floor(Math.random() * 3);
      return `SCG${rnd(n)}`;
    }

    // fallback: use Thai-style ORD-like code
    return generateThaiTracking();
  };

  const CARRIERS = [
    "ไปรษณีย์ไทย",
    "Flash",
    "J&T",
    "Kerry",
    "Ninja Van",
    "SCG Express",
    "DHL",
    "FedEx",
  ];

  const normalizeCarrier = (c) => {
    if (!c) return undefined;
    const s = String(c).trim();
    const map = {
      "flash express": "Flash",
      flash: "Flash",
      kerry: "Kerry",
      "kerry express": "Kerry",
      "j&t": "J&T",
      jnt: "J&T",
      ไปรษณีย์ไทย: "ไปรษณีย์ไทย",
      "ninja van": "Ninja Van",
      ninjavan: "Ninja Van",
      "scg express": "SCG Express",
      dhl: "DHL",
      fedex: "FedEx",
    };
    const key = s.toLowerCase();
    return map[key] || s;
  };

  // Fetch server-provided tracking formats/examples for admin UX hints
  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch(`/admin/tracking-formats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await resp.json();
        const formats = json?.formats || json?.data?.formats || json;
        if (!mounted) return;
        if (!formats) {
          setTrackingFormats(null);
          return;
        }
        // Normalize into a lookup map by lowercase keys and display names
        const map = {};
        if (Array.isArray(formats)) {
          for (const f of formats) {
            const names = [];
            if (f.name) names.push(f.name.toString().toLowerCase());
            if (f.display) names.push(f.display.toString().toLowerCase());
            if (f.key) names.push(f.key.toString().toLowerCase());
            // also allow aliases array
            if (Array.isArray(f.aliases))
              f.aliases.forEach((a) => names.push(String(a).toLowerCase()));
            for (const n of names) map[n] = f;
          }
        } else if (typeof formats === "object") {
          // assume key->format map
          for (const k of Object.keys(formats)) {
            map[k.toLowerCase()] = formats[k];
          }
        }
        setTrackingFormats(map);
      } catch {
        setTrackingFormats(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const findFormatForCarrier = (carrier) => {
    if (!carrier || !trackingFormats) return null;
    const c = String(carrier).toLowerCase();
    // direct lookup
    if (trackingFormats[c]) return trackingFormats[c];
    // fuzzy lookup: check if any format name/display contains the carrier key
    const vals = Object.values(trackingFormats || {});
    return (
      vals.find((f) =>
        (
          (f.name || "") +
          " " +
          (f.display || "") +
          " " +
          (f.key || "") +
          " " +
          (f.aliases || []).join(" ")
        )
          .toLowerCase()
          .includes(c)
      ) || null
    );
  };
  // compute current format lookup for UI hints
  const currentFormat = findFormatForCarrier(
    localEdits?.carrier || currentCarrier
  );

  async function handleGenerateTracking() {
    setGenerating(true);
    try {
      let code;
      const carrierToUse = localEdits?.carrier || currentCarrier || "";

      // Prefer client-side carrier-specific generator when we have a carrier
      if (carrierToUse) {
        try {
          code = _generateForCarrier(carrierToUse);
        } catch {
          console.warn("_generateForCarrier failed");
        }
      }

      // If not generated yet, try server generator (keeps previous behavior)
      if (!code && token && generateAdminTracking) {
        try {
          const resp = await generateAdminTracking(token, { format: "ORD" });
          code = resp?.data?.code || resp?.code;
        } catch {
          console.warn("generateAdminTracking failed");
        }
      }

      // Fallback
      if (!code) code = generateThaiTracking();
      // If carrier was provided, apply it directly. Otherwise generate suggestions for all carriers.
      if (carrierToUse) {
        handleFieldChange("tracking", code);
        setGeneratedCodes(null);
      } else {
        // generate one code per known carrier and show suggestions
        const list = {};
        for (const c of CARRIERS) {
          try {
            list[c] = _generateForCarrier(c);
          } catch {
            list[c] = generateThaiTracking();
          }
        }
        setGeneratedCodes(list);
      }
      toast.success("สร้างรหัสติดตามเรียบร้อย");
    } finally {
      setGenerating(false);
    }
  }

  async function checkTracking() {
    if (!currentCarrier || !currentTracking) {
      toast.warn("กรุณากรอกผู้ให้บริการและรหัสติดตาม");
      return;
    }
    setTrackingLoading(true);
    setTrackingResult(null);
    try {
      const resp = await fetch(`/api/shipping/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier: currentCarrier,
          tracking: currentTracking,
        }),
      });
      const data = await resp.json();
      setTrackingResult({ ok: resp.ok, data });
    } catch (err) {
      setTrackingResult({ ok: false, error: String(err) });
    } finally {
      setTrackingLoading(false);
      setActiveTab("tracking");
    }
  }

  async function handleSaveShippingInfoAndStatus() {
    setSaving(true);
    try {
      const edits = shippingEdits?.[orderId] || localEdits || {};
      if (!edits || (!edits.carrier && !edits.tracking)) {
        toast.info("ไม่มีการเปลี่ยนแปลงที่จะบันทึก");
        return;
      }

      if (!edits.carrier) {
        toast.error("กรุณาเลือกผู้ให้บริการ");
        return;
      }
      if (!token || !updateOrderShipping) {
        toast.error("ไม่พบสิทธิ์หรือฟังก์ชันบันทึก");
        return;
      }

      const payload = {
        carrier: normalizeCarrier(edits.carrier),
        tracking: edits.tracking || undefined,
      };
      console.info("updateOrderShipping payload:", { orderId, payload });
      toast.info("กำลังบันทึกข้อมูล...");
      const resp = await updateOrderShipping(token, orderId, payload);

      // axios returns a response object; if status >= 400 it throws, otherwise resp.data is payload
      if (resp && resp.data && resp.data.ok === false) {
        throw new Error(resp.data.message || "บันทึกข้อมูลล้มเหลว");
      }

      toast.success("บันทึกข้อมูลเรียบร้อย");

      if (handleSaveShippingInfo) handleSaveShippingInfo(orderId);
      // clear local and parent edits after successful save
      setLocalEdits({});
      if (setShippingEdits) {
        setShippingEdits((prev) => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });
      }
    } catch (e) {
      console.error("updateOrderShipping failed:", e);
      // Axios error shape
      const serverMessage =
        e?.response?.data?.message || e?.response?.data || e?.message;
      toast.error(
        `บันทึกข้อมูลล้มเหลว: ${serverMessage || "กรุณาลองใหม่อีกครั้ง"}`
      );
    } finally {
      setSaving(false);
    }
  }

  const handleCancelEdit = () => {
    if (setShippingEdits) {
      setShippingEdits((prev) => {
        const c = { ...prev };
        delete c[orderId];
        return c;
      });
    }
    setLocalEdits({});
    toast.info("ยกเลิกการแก้ไขเรียบร้อย");
  };

  if (!viewOrder) return null;

  // Compute financials and status once
  const products = viewOrder.products || [];
  const subtotal = products.reduce(
    (acc, p) =>
      acc +
      (p.price || p.variant?.price || p.product?.price || 0) * (p.count || 0),
    0
  );
  const shipping = Number(viewOrder.shippingFee || 0);
  const discount = Number(viewOrder.discountAmount || viewOrder.discount || 0);
  const total = Number(viewOrder.total || subtotal + shipping - discount);

  const getStatus = (status) => {
    if (!status) return "ไม่ระบุ";
    const raw = status.toString();
    const s = raw.toLowerCase();

    // Explicit mapping for server enum values and common text variants
    if (
      raw === "NOT_PROCESSED" ||
      s.includes("not_processed") ||
      s.includes("pending") ||
      s.includes("รอดำเนินการ")
    )
      return "รอดำเนินการ";

    if (s.includes("processing") || s.includes("กำลังดำเนินการ"))
      return "กำลังดำเนินการ";

    if (s.includes("shipped") || s.includes("จัดส่ง")) return "จัดส่งแล้ว";

    if (s.includes("delivered") || s.includes("จัดส่งสำเร็จ"))
      return "จัดส่งสำเร็จ";

    if (s.includes("cancel") || s.includes("ยกเลิก")) return "ยกเลิก";

    return raw || "ไม่ระบุ";
  };
  const statusLabel = getStatus(viewOrder?.orderStatus);

  const getStatusColor = (label) => {
    if (label === "รอดำเนินการ") return "text-yellow-600";
    if (label === "กำลังดำเนินการ") return "text-blue-600";
    if (label === "จัดส่งแล้ว" || label === "จัดส่งสำเร็จ")
      return "text-green-600";
    if (label === "ยกเลิก") return "text-red-600";
    return "text-gray-600";
  };
  const statusColor = getStatusColor(statusLabel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl bg-gray-50 rounded-2xl shadow-2xl border overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-gray-800">
                รายละเอียดคำสั่งซื้อ
              </div>
              <div className="text-sm text-gray-500 font-mono">
                #{orderId}{" "}
                <span className="text-xs">
                  • สร้างเมื่อ{" "}
                  {dateFormatTH
                    ? dateFormatTH(viewOrder.createdAt)
                    : viewOrder.createdAt}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setViewOrder(null)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            title="ปิด"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </header>

        {/* Main Content & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-h-[80vh] overflow-y-auto">
          {/* Main Panel */}
          <main className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap gap-3">
              <TabButton
                active={activeTab === "summary"}
                onClick={() => setActiveTab("summary")}
              >
                สรุป
              </TabButton>
              <TabButton
                active={activeTab === "shipping"}
                onClick={() => setActiveTab("shipping")}
              >
                การจัดส่ง
              </TabButton>
              {/* <TabButton
                active={activeTab === "tracking"}
                onClick={() => setActiveTab("tracking")}
              >
                ติดตามพัสดุ
              </TabButton> */}
            </div>

            <div className="space-y-6">
              {activeTab === "summary" && (
                <>
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard
                      icon={<User className="w-5 h-5 text-green-600" />}
                      title="ข้อมูลลูกค้า"
                    >
                      <div className="text-sm text-gray-700 space-y-2">
                        <div className="font-semibold text-gray-900">
                          {viewOrder.name ||
                            viewOrder.address?.name ||
                            "ไม่ระบุ"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {viewOrder.orderedBy?.email || viewOrder.email || "-"}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                          <Phone className="w-4 h-4" />
                          <span>
                            {viewOrder.address?.telephone ||
                              viewOrder.orderedBy?.telephone ||
                              viewOrder.telephone ||
                              "-"}
                          </span>
                        </div>
                      </div>
                    </InfoCard>
                    <InfoCard
                      icon={<MapPin className="w-5 h-5 text-blue-600" />}
                      title="ที่อยู่จัดส่ง"
                    >
                      <div className="text-sm text-gray-700 space-y-2">
                        <div className="font-semibold text-gray-900">
                          {viewOrder.address?.name ||
                            viewOrder.orderedBy?.name ||
                            "ไม่ระบุ"}
                        </div>
                        <p className="text-xs text-gray-600">
                          {viewOrder.address?.address ||
                            viewOrder.orderedBy?.address ||
                            "-"}
                        </p>
                      </div>
                    </InfoCard>
                  </section>
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-800">
                        รายการสินค้า
                      </h3>
                      <div className="text-sm text-gray-500">
                        {(viewOrder.products || []).length} รายการ
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3 w-10">#</th>
                              <th className="px-4 py-3">สินค้า</th>
                              <th className="px-4 py-3 text-right">ราคา</th>
                              <th className="px-4 py-3 text-center">จำนวน</th>
                              <th className="px-4 py-3 text-right">รวม</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {products.map((p, i) => (
                              <tr
                                key={i}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3 font-medium text-gray-700">
                                  {i + 1}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                      <img
                                        src={productImageUrl(p)}
                                        className="w-full h-full object-cover"
                                        alt={p.product?.title}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src =
                                            "https://placehold.co/56x56";
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-800">
                                        {p.product?.title}
                                      </div>
                                      {/* <div className="text-xs text-gray-500">
                                        {p.variant?.title || "ไม่ระบุ"}
                                      </div> */}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700">
                                  {numberFormat(
                                    p.price ||
                                      p.variant?.price ||
                                      p.product?.price ||
                                      0
                                  )}{" "}
                                  บาท
                                </td>
                                <td className="px-4 py-3 text-center text-gray-700">
                                  x{p.count}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                  {numberFormat(
                                    (p.price ||
                                      p.variant?.price ||
                                      p.product?.price ||
                                      0) * (p.count || 0)
                                  )}{" "}
                                  บาท
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-6">
                  <InfoCard
                    icon={<Package className="w-5 h-5 text-gray-600" />}
                    title="จัดการการจัดส่ง"
                  >
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-600">
                          ผู้ให้บริการ
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                          value={localEdits.carrier ?? currentCarrier}
                          onChange={(e) =>
                            handleFieldChange("carrier", e.target.value)
                          }
                        >
                          <option value="">เลือกผู้ให้บริการ</option>
                          {CARRIERS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-600">
                          รหัสติดตาม
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className="flex-1 border border-gray-300 rounded-md px-4 py-2 font-mono text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                            value={localEdits.tracking ?? currentTracking}
                            onChange={(e) =>
                              handleFieldChange("tracking", e.target.value)
                            }
                            placeholder="รหัสติดตาม"
                          />
                          <button
                            onClick={handleGenerateTracking}
                            className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                            title="สร้างรหัสใหม่"
                            disabled={generating}
                          >
                            {generating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <PlusCircle className="w-4 h-4" />
                            )}
                          </button>
                          {/* Suggestion list when generating without carrier */}
                        </div>
                      </div>
                      {generatedCodes && (
                        <div className="mt-2 grid grid-cols-1 gap-2">
                          {Object.entries(generatedCodes).map(([c, code]) => (
                            <div
                              key={c}
                              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm"
                            >
                              <div className="truncate">
                                <span className="font-medium mr-2">{c}:</span>
                                <span className="font-mono">{code}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    handleFieldChange("carrier", c);
                                    handleFieldChange("tracking", code);
                                    setGeneratedCodes(null);
                                  }}
                                  className="px-2 py-1 bg-blue-600 text-white rounded-md text-xs"
                                >
                                  ใช้
                                </button>
                                <button
                                  onClick={() =>
                                    navigator.clipboard?.writeText(code)
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                                >
                                  คัดลอก
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* copy button removed */}
                      {validateTracking && (
                        <div className="flex flex-col gap-1 text-sm mt-1">
                          <div className="flex items-center gap-2">
                            {validateTracking(
                              currentCarrier,
                              currentTracking
                            ) ? (
                              <span className="text-green-600 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> รหัสถูกต้อง
                              </span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-2">
                                <XCircle className="w-4 h-4" /> รหัสไม่ถูกต้อง
                              </span>
                            )}
                          </div>
                          {currentFormat && (
                            <div className="text-xs text-gray-500">
                              ตัวอย่างรูปแบบ:{" "}
                              <span className="font-mono">
                                {currentFormat.example ||
                                  currentFormat.examples?.[0] ||
                                  currentFormat.sample}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        disabled={saving}
                      >
                        <Trash2 className="w-4 h-4" /> ยกเลิก
                      </button>
                      <button
                        onClick={handleSaveShippingInfoAndStatus}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                        disabled={
                          saving ||
                          !(
                            localEdits?.carrier ||
                            shippingEdits?.[orderId]?.carrier
                          )
                        }
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}{" "}
                        บันทึก
                      </button>
                    </div>
                  </InfoCard>

                  <InfoCard
                    icon={<MapPin className="w-5 h-5 text-gray-600" />}
                    title="ที่อยู่สำหรับจัดส่ง"
                  >
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>
                        <strong>ผู้รับ:</strong>{" "}
                        {viewOrder.address?.name ||
                          viewOrder.orderedBy?.name ||
                          "-"}
                      </p>
                      <p>
                        <strong>ที่อยู่:</strong>{" "}
                        {viewOrder.address?.address ||
                          viewOrder.orderedBy?.address ||
                          "-"}
                      </p>
                      <p>
                        <strong>โทรศัพท์:</strong>{" "}
                        {viewOrder.address?.telephone ||
                          viewOrder.telephone ||
                          "-"}
                      </p>
                    </div>
                  </InfoCard>
                </div>
              )}

              {activeTab === "tracking" && (
                <InfoCard
                  icon={<Clock className="w-5 h-5 text-gray-600" />}
                  title="สถานะติดตามพัสดุ"
                >
                  <div className="min-h-[120px] flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                          ผู้ให้บริการ:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {currentCarrier || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                          รหัสติดตาม:
                        </span>
                        <span className="font-semibold font-mono text-gray-900">
                          {currentTracking || "-"}
                        </span>
                      </div>
                      <button
                        onClick={checkTracking}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        disabled={
                          trackingLoading || !currentCarrier || !currentTracking
                        }
                      >
                        {trackingLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}{" "}
                        ตรวจสอบ
                      </button>
                    </div>
                    {trackingLoading && (
                      <div className="flex flex-col items-center justify-center text-sm text-gray-500 h-24">
                        <Loader2 className="w-6 h-6 mb-2 animate-spin" />
                        <span>กำลังเรียกดูข้อมูล...</span>
                      </div>
                    )}
                    {!trackingLoading && trackingResult && (
                      <TrackingResultView result={trackingResult.data} />
                    )}
                    {!trackingLoading &&
                      trackingResult &&
                      !trackingResult.ok && (
                        <div className="text-sm text-red-500 flex flex-col items-center justify-center h-24">
                          <XCircle className="w-6 h-6 mb-2" />
                          <span className="text-center">
                            เกิดข้อผิดพลาด:{" "}
                            {trackingResult.error ||
                              trackingResult.data?.message ||
                              "ไม่สามารถตรวจสอบได้"}
                          </span>
                        </div>
                      )}
                    {!trackingLoading && !trackingResult && (
                      <div className="text-sm text-gray-400 text-center h-24 flex items-center justify-center">
                        กรุณากรอกผู้ให้บริการและรหัสติดตามเพื่อเริ่มการตรวจสอบ
                      </div>
                    )}
                  </div>
                </InfoCard>
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <InfoCard
              icon={<ClipboardList className="w-5 h-5 text-gray-600" />}
              title="รายละเอียดคำสั่งซื้อ"
            >
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">สถานะ</div>
                  <div className={`font-semibold ${statusColor}`}>
                    {statusLabel}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">วันที่สั่ง</div>
                  <div className="text-sm">
                    {dateFormatTH
                      ? dateFormatTH(viewOrder.createdAt)
                      : viewOrder.createdAt}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>ยอดสินค้า (รวม)</span>
                    <span>{numberFormat(subtotal)} บาท</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>ค่าจัดส่ง</span>
                    <span>{numberFormat(shipping)} บาท</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>ส่วนลด</span>
                    <span>- {numberFormat(discount)} บาท</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-bold text-gray-900 text-base">
                    <span>ยอดรวมสุทธิ</span>
                    <span>{numberFormat(total)} บาท</span>
                  </div>
                </div>
              </div>
            </InfoCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
