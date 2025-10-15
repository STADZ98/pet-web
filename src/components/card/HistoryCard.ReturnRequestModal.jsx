import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

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

    // move focus into the modal
    const root = modalRootRef.current;
    const focusable = root
      ? root.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      : [];
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

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

  const statusLabel = (s) => {
    if (!s) return "ไม่ระบุ";
    switch (s) {
      case "PENDING":
        return "รอดำเนินการ";
      case "APPROVED":
        return "อนุมัติแล้ว";
      case "REJECTED":
        return "ปฏิเสธ";
      default:
        return s;
    }
  };

  const statusColor = (s) => {
    switch (s) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const apiBase = import.meta.env.VITE_API || "";

  return (
    <dialog open={isOpen} className="fixed inset-0 z-[1200]">
      <div className="fixed inset-0 bg-black/60" onClick={closeModal} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={modalRootRef}
          className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-auto max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-label="รายละเอียดคำขอคืนสินค้า"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" />
              <div>
                <h3 className="text-lg font-bold">รายละเอียดคำขอคืนสินค้า</h3>
                <div className="text-sm text-gray-500">
                  คำขอ #{data?.id || "-"}
                </div>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-100"
            >
              <X />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {loading ? (
              <div className="text-center py-8">กำลังโหลดข้อมูล...</div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 font-semibold mb-3">
                  เกิดข้อผิดพลาด
                </div>
                <div className="text-sm text-gray-600 mb-4">{error}</div>
                {onRetry && (
                  <div className="flex justify-center">
                    <button
                      onClick={onRetry}
                      className="px-4 py-2 bg-blue-600 text-white rounded-full"
                    >
                      ลองใหม่
                    </button>
                  </div>
                )}
              </div>
            ) : !data ? (
              <div className="text-center py-8">ไม่พบข้อมูลคำขอคืน</div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">สถานะ</div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor(
                      data.status
                    )}`}
                  >
                    {statusLabel(data.status)}
                  </div>
                </div>

                <div>
                  <div className="font-semibold">เหตุผล</div>
                  <div className="text-sm text-gray-700">
                    {data.reason}{" "}
                    {data.customReason ? `- ${data.customReason}` : ""}
                  </div>
                </div>

                <div>
                  <div className="font-semibold">คำสั่งซื้อที่เกี่ยวข้อง</div>
                  <div className="text-sm text-gray-700">
                    คำสั่งซื้อ #{data.order?.id || data.orderId}
                  </div>
                </div>

                <div>
                  <div className="font-semibold">สินค้าที่ขอคืน</div>
                  <ul className="list-disc pl-5 mt-2">
                    {data.products && data.products.length > 0 ? (
                      data.products.map((p) => (
                        <li key={p.id} className="mb-2">
                          <div className="font-medium">
                            {p.product?.title || p.productId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Product ID: {p.productId}
                          </div>
                        </li>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">ไม่มีรายการ</div>
                    )}
                  </ul>
                </div>

                <div>
                  <div className="font-semibold mb-2">รูปภาพที่แนบ</div>
                  <div className="grid grid-cols-3 gap-2">
                    {data.images && data.images.length > 0 ? (
                      data.images.map((img) => {
                        const src = `${apiBase}/user/return-image/${img.id}`;
                        return (
                          <button
                            key={img.id}
                            onClick={() => setLightboxSrc(src)}
                            className="w-full h-28 overflow-hidden rounded"
                            title="คลิกเพื่อขยาย"
                          >
                            <img
                              src={src}
                              alt={img.filename || `img-${img.id}`}
                              className="w-full h-28 object-cover rounded"
                            />
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-sm text-gray-500">ไม่มีรูป</div>
                    )}
                  </div>
                </div>

                {data.adminNote && (
                  <div>
                    <div className="font-semibold">หมายเหตุจากแอดมิน</div>
                    <div className="text-sm text-gray-700">
                      {data.adminNote}
                    </div>
                  </div>
                )}

                {data.handledAt && (
                  <div className="text-sm text-gray-500">
                    จัดการเมื่อ {new Date(data.handledAt).toLocaleString()}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-slate-100 rounded-full hover:bg-slate-200"
                  >
                    ปิด
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox overlay */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80">
          <button
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 text-white"
            onClick={() => setLightboxSrc(null)}
          >
            <X />
          </button>
          <img
            src={lightboxSrc}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </dialog>
  );
};

export default ReturnRequestModal;
