import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Package,
  MessageCircle,
  FileText,
  ShoppingCart,
  Info,
} from "lucide-react";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString; // Fallback
  }
};

// Props:
// - isOpen: boolean
// - closeModal: () => void
// - data: returnRequest object or null
// - loading: optional boolean
// - error: optional string
// - onRetry: optional function to refetch

const ReturnRequestModal = ({
  isOpen,
  closeModal,
  data,
  loading,
  error,
  onRetry,
}) => {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const modalRootRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Manage focus trap and Escape key + body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    // store previously focused element to restore focus on close
    previouslyFocusedRef.current = document.activeElement;

    // lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // move focus into the modal (using setTimeout for next tick in case modal content isn't fully rendered)
    const timeout = setTimeout(() => {
      const root = modalRootRef.current;
      const focusable = root
        ? root.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        : [];
      if (focusable && focusable.length > 0) {
        // Find a suitable first focusable element, e.g., the close button
        const closeButton = root.querySelector('[aria-label="ปิด"]');
        if (closeButton) {
          closeButton.focus();
        } else {
          focusable[0].focus();
        }
      }
    }, 0);

    const handleKey = (e) => {
      if (e.key === "Escape") {
        // if lightbox open, close it first
        if (lightboxSrc) {
          setLightboxSrc(null);
          return;
        }
        closeModal();
      }
      if (e.key === "Tab") {
        // simple focus trap
        const root = modalRootRef.current;
        const focusable = root
          ? root.querySelectorAll(
              'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          : [];

        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow || "";
      try {
        previouslyFocusedRef.current?.focus();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lightboxSrc]);

  if (!isOpen) return null;

  const getStatusInfo = (s) => {
    switch (s) {
      case "PENDING":
        return {
          label: "รอดำเนินการ",
          color: "bg-amber-100 text-amber-700 ring-amber-500/20",
          icon: Clock,
        };
      case "APPROVED":
        return {
          label: "อนุมัติแล้ว",
          color: "bg-emerald-100 text-emerald-700 ring-emerald-500/20",
          icon: CheckCircle,
        };
      case "REJECTED":
        return {
          label: "ปฏิเสธ",
          color: "bg-rose-100 text-rose-700 ring-rose-500/20",
          icon: X,
        };
      default:
        return {
          label: s || "ไม่ระบุ",
          color: "bg-gray-100 text-gray-700 ring-gray-500/20",
          icon: Info,
        };
    }
  };

  const statusInfo = getStatusInfo(data?.status);
  const StatusIcon = statusInfo.icon;

  const apiBase = import.meta.env.VITE_API || "";

  const publicBase = import.meta.env.BASE_URL || "/";
  const publicNoImage = `${publicBase.replace(/\/$/, "")}/no-image.png`;

  // Component for displaying a single detail row
  const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
      <Icon className="w-5 h-5 mt-0.5 text-blue-500 flex-shrink-0" />
      <div className="flex-grow">
        <div className="text-sm font-medium text-gray-500">{label}</div>
        <div className="text-base font-semibold text-gray-800 break-words">
          {value}
        </div>
      </div>
    </div>
  );

  // Determine product thumbnail source with fallbacks
  const getProductImageSrc = (p) => {
    if (!p) return publicNoImage;
    const variant = p.variant || p.product?.variant;
    const prod = p.product || {};
    const candidates = [
      variant?.images?.[0]?.url,
      variant?.images?.[0],
      variant?.image,
      prod?.images?.[0]?.url,
      prod?.images?.[0],
      prod?.image,
      prod?.thumbnail,
      prod?.thumb,
    ];

    for (let c of candidates) {
      if (!c) continue;
      // if already absolute URL, return as-is
      if (typeof c === "string") {
        const s = c.trim();
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        if (s.startsWith("/")) return s; // root-relative
        // relative path or bare filename: try prefixing apiBase if set, else BASE_URL
        if (apiBase) return `${apiBase.replace(/\/$/, "")}/${s}`;
        return `${publicBase.replace(/\/$/, "")}/${s}`;
      }
      // if it's an object with url prop
      if (c && typeof c === "object" && c.url) {
        const s = c.url;
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        if (s.startsWith("/")) return s;
        if (apiBase) return `${apiBase.replace(/\/$/, "")}/${s}`;
        return `${publicBase.replace(/\/$/, "")}/${s}`;
      }
    }

    return publicNoImage;
  };

  return (
    <dialog
      open={isOpen}
      className="fixed inset-0 z-[1200] backdrop:bg-black/60"
    >
      <div
        className="fixed inset-0 bg-black/60"
        onClick={closeModal}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={modalRootRef}
          className="w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300"
          role="dialog"
          aria-modal="true"
          aria-label="รายละเอียดคำขอคืนสินค้า"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <StatusIcon
                className={`w-6 h-6 ${
                  statusInfo.color.includes("rose")
                    ? "text-rose-600"
                    : statusInfo.color.includes("emerald")
                    ? "text-emerald-600"
                    : statusInfo.color.includes("amber")
                    ? "text-amber-600"
                    : "text-gray-600"
                }`}
              />
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  รายละเอียดคำขอคืนสินค้า
                </h3>
                <div className="text-sm text-gray-500 font-mono">
                  <span className="font-semibold text-gray-600">
                    Request ID:
                  </span>{" "}
                  #{data?.id || "N/A"}
                </div>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-slate-100 transition-colors"
              aria-label="ปิด"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12 text-lg text-gray-600">
                <div className="animate-spin inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mr-2" />
                กำลังโหลดข้อมูล...
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <div className="text-xl text-red-700 font-bold mb-2">
                  เกิดข้อผิดพลาดในการโหลด
                </div>
                <div className="text-sm text-gray-600 mb-4">{error}</div>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition-colors"
                  >
                    ลองโหลดใหม่
                  </button>
                )}
              </div>
            ) : !data ? (
              <div className="text-center py-12 text-lg text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
                <Info className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                ไม่พบข้อมูลคำขอคืนสินค้า
              </div>
            ) : (
              <>
                {/* Status and Primary Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`col-span-1 p-4 rounded-lg shadow-md ring-1 ${statusInfo.color} flex items-center justify-between`}
                  >
                    <div className="text-sm font-medium">สถานะปัจจุบัน</div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-bold ${statusInfo.color
                        .replace("ring-", "bg-")
                        .replace("/20", "")}`}
                    >
                      {statusInfo.label}
                    </div>
                  </div>
                  <DetailRow
                    icon={ShoppingCart}
                    label="คำสั่งซื้อ"
                    value={`#${data.order?.id || data.orderId || "N/A"}`}
                  />
                  <DetailRow
                    icon={Clock}
                    label="วันที่จัดการ"
                    value={
                      data.handledAt
                        ? formatDate(data.handledAt)
                        : "ยังไม่ได้จัดการ"
                    }
                  />
                </div>

                {/* Reason and Admin Note */}
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-indigo-50/50">
                    <DetailRow
                      icon={FileText}
                      label="เหตุผลหลัก"
                      value={`${data.reason}`}
                    />
                    {data.customReason && (
                      <div className="pl-8 pt-2 text-sm text-gray-600 italic">
                        <span className="font-semibold">
                          รายละเอียดเพิ่มเติม:
                        </span>{" "}
                        {data.customReason}
                      </div>
                    )}
                  </div>
                  {data.adminNote && (
                    <div className="p-4 border rounded-lg border-rose-300 bg-rose-50">
                      <DetailRow
                        icon={MessageCircle}
                        label="หมายเหตุจากแอดมิน"
                        value={data.adminNote}
                      />
                    </div>
                  )}
                </div>

                {/* Products Section */}
                <div>
                  <h4 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-500" />{" "}
                    สินค้าที่ขอคืน
                  </h4>
                  <div className="bg-white border rounded-lg shadow-sm divide-y">
                    {data.products && data.products.length > 0 ? (
                      data.products.map((p, index) => {
                        const imgSrc = getProductImageSrc(p);
                        const title =
                          p.product?.title ||
                          p.productId ||
                          "ไม่ระบุชื่อสินค้า";
                        return (
                          <div
                            key={p.id || index}
                            className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                <img
                                  src={imgSrc}
                                  alt={title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/no-image.png";
                                  }}
                                />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  <span className="font-semibold">ID:</span>{" "}
                                  {p.productId}
                                  {p.quantity && (
                                    <span className="ml-4">
                                      จำนวน: {p.quantity}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Optional: Add price or other product details here */}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-sm text-gray-500">
                        ไม่มีรายการสินค้าในคำขอนี้
                      </div>
                    )}
                  </div>
                </div>

                {/* Images Section */}
                <div>
                  <h4 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />{" "}
                    รูปภาพที่แนบ ({data.images?.length || 0} ภาพ)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {data.images && data.images.length > 0 ? (
                      data.images.map((img) => {
                        const src = `${apiBase}/user/return-image/${img.id}`;
                        return (
                          <button
                            key={img.id}
                            onClick={() => setLightboxSrc(src)}
                            className="w-full h-32 overflow-hidden rounded-lg shadow-md hover:shadow-xl hover:ring-4 ring-blue-400 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500"
                            title="คลิกเพื่อขยายรูปภาพ"
                            aria-label={`ขยายรูปภาพ ${img.filename || img.id}`}
                          >
                            <img
                              src={src}
                              alt={img.filename || `Image ${img.id}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-4 text-sm text-gray-500 p-4 border rounded-lg bg-gray-50">
                        ไม่มีรูปภาพแนบมาด้วย
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer/Close Button */}
          <div className="sticky bottom-0 bg-white z-10 p-6 border-t flex justify-end">
            <button
              onClick={closeModal}
              className="px-6 py-2 text-base font-semibold bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors shadow-sm"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox overlay */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/90 transition-opacity duration-300">
          <button
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => setLightboxSrc(null)}
            aria-label="ปิดรูปภาพที่ขยาย"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxSrc}
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-lg"
            alt="รูปภาพที่ขยาย"
          />
        </div>
      )}
    </dialog>
  );
};

export default ReturnRequestModal;
