import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Loader2,
  Mail,
  Hash,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API } from "../../api/admin";

const RequestDetailModal = ({
  open,
  onClose,
  request,
  onAction,
  updatingId,
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);
  const panelRef = useRef(null);

  // Focus handling
  useEffect(() => {
    if (open) {
      setRejectReason("");
      setConfirmReject(false);
      setTimeout(() => panelRef.current?.focus(), 120);

      const onKey = (e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Tab") {
          const focusable = panelRef.current?.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open, onClose]);

  // Status mapping
  const STATUS_MAP = {
    PENDING: {
      class:
        "font-bold px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700",
      label: "รอดำเนินการ",
    },
    APPROVED: {
      class:
        "font-bold px-3 py-1 rounded-full text-sm bg-green-100 text-green-700",
      label: "อนุมัติแล้ว",
    },
    REJECTED: {
      class: "font-bold px-3 py-1 rounded-full text-sm bg-red-100 text-red-700",
      label: "ถูกปฏิเสธ",
    },
    DEFAULT: {
      class:
        "font-bold px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700",
      label: "ไม่ทราบสถานะ",
    },
  };

  const normalize = (raw) => {
    const s = (raw || "").toString().toUpperCase();
    if (s === "รอดำเนินการ" || s === "PENDING") return "PENDING";
    if (s === "อนุมัติแล้ว" || s === "APPROVED") return "APPROVED";
    if (s === "ถูกปฏิเสธ" || s === "REJECTED") return "REJECTED";
    return s;
  };

  if (!open || !request) return null;

  // ✅ ฟังก์ชันช่วยสร้าง URL รูปสินค้าจากทุกกรณี
  const buildProductImageUrl = (img) => {
    if (!img) return "/no-image.png";

    // base64
    if (typeof img === "string" && img.startsWith("data:image")) return img;

    // path ภายใน server
    if (typeof img === "string" && !img.startsWith("http")) {
      const base = (API || "").replace(/\/+$/, "");
      return `${base}${img.startsWith("/") ? "" : "/"}${img}`;
    }

    // URL ปกติ
    return img;
  };

  // ✅ ฟังก์ชันสร้าง URL สำหรับภาพประกอบการคืน
  const buildEvidenceUrl = (img) => {
    if (!img) return null;

    // If it's a string, resolve absolute/relative cases
    if (typeof img === "string") {
      const s = img.trim();
      // data or blob urls are used as-is
      if (/^data:|^blob:/i.test(s)) return s;
      // full http(s) urls -> normalize to https
      if (/^(https?:)?\/\//i.test(s)) {
        return s.startsWith("http://") ? s.replace("http://", "https://") : s;
      }
      // relative path starting with / -> prefix with API base if available, otherwise use current origin
      if (s.startsWith("/")) {
        const base = (API || "").replace(/\/+$/, "");
        if (base) return `${base}${s}`;
        return `${window.location.origin}${s}`;
      }
      // other strings (maybe filename) -> try prefix with API
      const base = (API || "").replace(/\/+$/, "");
      return base ? `${base}/${s.replace(/^\/+/, "")}` : s;
    }

    // Object with url/src
    if (img && (img.url || img.src)) {
      return buildEvidenceUrl(img.url || img.src);
    }

    // ReturnImage record with id
    if (img && img.id) {
      const base = (API || "").replace(/\/+$/, "");
      if (base) return `${base}/user/return-image/${img.id}`;
      return `${window.location.origin}/user/return-image/${img.id}`;
    }

    return null;
  };

  const productImgs = (request.products || [])
    .map((p) => ({
      src: buildProductImageUrl(p?.product?.image),
      alt: p?.product?.title || "รูปสินค้า",
      type: "product",
    }))
    .filter((x) => !!x.src);

  const evidenceImgs = (request.images || [])
    .map((img) => {
      const src = buildEvidenceUrl(img);
      return src
        ? { src, alt: img?.filename || "ภาพประกอบ", type: "evidence" }
        : null;
    })
    .filter(Boolean);

  const allImages = [...productImgs, ...evidenceImgs];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-end"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="relative ml-auto w-full h-full sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out translate-x-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-detail-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-5 border-b flex justify-between items-center shadow-sm">
          <div>
            <h3
              id="return-detail-title"
              className="text-xl font-bold text-gray-800"
            >
              คำร้องขอคืน: <span className="text-blue-600">{request.id}</span>
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Hash className="w-4 h-4" />
              ยื่นคำร้องเมื่อ:{" "}
              {new Date(request.createdAt).toLocaleString("th-TH")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="ปิดรายละเอียด"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6" tabIndex={-1} ref={panelRef}>
          {/* Status & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase text-gray-500">
                สถานะปัจจุบัน
              </h4>
              {(() => {
                const norm = normalize(request.status);
                const info = STATUS_MAP[norm] || STATUS_MAP.DEFAULT;
                return <div className={info.class}>{info.label}</div>;
              })()}
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase text-gray-500">
                ลูกค้า
              </h4>
              <p className="text-sm text-gray-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                {request.user?.email || "ไม่ระบุ"}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              เหตุผลในการขอคืนสินค้า
            </h4>
            <p className="text-base text-gray-800 italic">
              "{request.reason || "ไม่มีรายการ"}"
            </p>
          </div>

          {/* Rejection Note */}
          {normalize(request.status) === "REJECTED" &&
            request.rejectionNote && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  หมายเหตุการปฏิเสธ
                </h4>
                <p className="text-sm text-red-800 mt-2">
                  {request.rejectionNote}
                </p>
              </div>
            )}

          {/* Product List */}
          <div>
            <h4 className="text-base font-semibold text-gray-800 mb-3">
              รายการสินค้าที่ขอคืน ({request.products?.length || 0})
            </h4>
            <div className="space-y-3">
              {request.products?.map((it) => (
                <div
                  key={it.id}
                  className="flex gap-4 items-center p-3 rounded-xl border hover:bg-gray-50 transition"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const idx = allImages.findIndex(
                        (x) =>
                          x.type === "product" &&
                          x.src === buildProductImageUrl(it?.product?.image)
                      );
                      if (idx >= 0) {
                        setLightboxIndex(idx);
                        setLightboxImages(allImages);
                        setLightboxOpen(true);
                      }
                    }}
                    className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border"
                  >
                    <img
                      src={buildProductImageUrl(it?.product?.image)}
                      onError={(e) => (e.currentTarget.src = "/no-image.png")}
                      alt={it?.product?.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 line-clamp-1">
                      {it?.product?.title || "ไม่ทราบชื่อสินค้า"}
                    </p>
                    <p className="text-sm text-gray-500">
                      จำนวน:{" "}
                      <span className="font-medium">{it.count || 1}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Images */}
          {evidenceImgs.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-gray-800 mb-3">
                ภาพประกอบ ({evidenceImgs.length})
              </h4>
              <div className="mt-2 flex gap-3 overflow-x-auto p-1">
                {evidenceImgs.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const idxAll = allImages.findIndex(
                        (x) => x.src === img.src
                      );
                      setLightboxImages(allImages);
                      setLightboxIndex(idxAll >= 0 ? idxAll : 0);
                      setLightboxOpen(true);
                    }}
                    className="w-24 h-24 rounded-lg overflow-hidden border shadow-sm cursor-pointer hover:shadow-md transition duration-150"
                  >
                    <img
                      src={img.src}
                      onError={(e) => (e.currentTarget.src = "/no-image.png")}
                      alt={img.alt || `evidence-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Debug URLs */}
          {evidenceImgs.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              <details className="mt-2">
                <summary className="cursor-pointer">
                  🔍 รายละเอียด URL รูป (debug)
                </summary>
                <ul className="list-disc pl-5 mt-2">
                  {evidenceImgs.map((img, i) => (
                    <li key={i} className="break-words">
                      {img.src}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}

          {/* Lightbox */}
          {lightboxOpen && lightboxImages.length > 0 && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
              role="dialog"
              aria-modal="true"
              onClick={() => setLightboxOpen(false)}
            >
              <div
                className="relative max-w-[95%] max-h-[95%]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-2 right-2 z-50 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <button
                  onClick={() =>
                    setLightboxIndex(
                      (i) =>
                        (i - 1 + lightboxImages.length) % lightboxImages.length
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <img
                  src={lightboxImages[lightboxIndex].src}
                  onError={(e) => (e.currentTarget.src = "/no-image.png")}
                  alt={lightboxImages[lightboxIndex].alt || "รูปขนาดใหญ่"}
                  className="max-w-full max-h-[80vh] object-contain mx-auto block"
                />

                <button
                  onClick={() =>
                    setLightboxIndex((i) => (i + 1) % lightboxImages.length)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="mt-2 text-center text-sm text-white/90">
                  {lightboxImages[lightboxIndex].alt}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 border-t mt-6">
            <h4 className="text-base font-semibold text-gray-800 mb-3">
              การดำเนินการ
            </h4>
            <div className="flex flex-wrap gap-3">
              <button
                disabled={
                  updatingId === request.id ||
                  normalize(request.status) === "APPROVED"
                }
                onClick={() => onAction(request.id, "APPROVED")}
                className="flex items-center justify-center px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {updatingId === request.id ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  "✅ อนุมัติคำร้อง"
                )}
              </button>

              <button
                onClick={() => setConfirmReject((s) => !s)}
                className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-md"
              >
                {confirmReject ? "ยกเลิกการปฏิเสธ" : "❌ ปฏิเสธคำร้อง"}
              </button>
            </div>

            {confirmReject && (
              <div className="space-y-3 mt-4 p-4 border border-red-300 rounded-lg bg-red-50">
                <label
                  htmlFor="reject-reason"
                  className="block text-sm font-semibold text-red-800"
                >
                  เหตุผลการปฏิเสธ (จำเป็นต้องระบุ)
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="ระบุเหตุผลที่ชัดเจนในการปฏิเสธคำร้อง"
                  className="w-full border border-red-300 rounded-lg p-3 focus:ring-red-500 focus:border-red-500 transition"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    disabled={!rejectReason.trim() || updatingId === request.id}
                    onClick={() => {
                      onAction(request.id, "REJECTED", { note: rejectReason });
                      onClose();
                    }}
                    className="px-4 py-2 rounded-lg bg-red-700 text-white font-medium hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {updatingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "ยืนยันการปฏิเสธ"
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmReject(false)}
                    className="px-4 py-2 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default RequestDetailModal;
