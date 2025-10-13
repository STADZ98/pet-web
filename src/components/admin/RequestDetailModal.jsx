import React, { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

const RequestDetailModal = ({
  open,
  onClose,
  request,
  onAction,
  updatingId,
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      setRejectReason("");
      setConfirmReject(false);
      // focus
      setTimeout(() => panelRef.current?.focus(), 120);

      const onKey = (e) => {
        if (e.key === "Escape") onClose();
        // basic focus trap: tab within modal
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

  if (!open || !request) return null;

  return (
    <div className="fixed inset-0 z-40 flex" role="presentation">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="ml-auto w-full h-full sm:max-w-lg md:max-w-2xl bg-white shadow-xl overflow-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-detail-title"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 id="return-detail-title" className="text-lg font-semibold">
              คำร้องขอคืน: {request.id}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(request.createdAt).toLocaleString("th-TH")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="close detail"
          >
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4" tabIndex={-1} ref={panelRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium">ลูกค้า</h4>
              <p className="text-sm">{request.user?.email || "ไม่ระบุ"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">สถานะ</h4>
              <p className="text-sm">{request.status}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium">เหตุผล</h4>
            <p className="text-sm text-gray-700">
              {request.reason || "ไม่มีรายการ"}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium">รายการสินค้า</h4>
            <div className="space-y-2 mt-2">
              {request.products?.map((it) => (
                <div
                  key={it.id}
                  className="flex gap-3 items-center border p-2 rounded-md"
                >
                  <img
                    src={it?.product?.image || "/no-image.png"}
                    alt={it?.product?.title}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div>
                    <p className="font-semibold">
                      {it?.product?.title || "ไม่ทราบชื่อ"}
                    </p>
                    <p className="text-xs text-gray-500">
                      จำนวน: {it.count || 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {request.images?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium">ภาพประกอบ</h4>
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {request.images.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`evidence-${idx}`}
                    className="w-24 h-24 object-cover rounded-md border"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t" />

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                disabled={
                  updatingId === request.id || request.status === "APPROVED"
                }
                onClick={() => onAction(request.id, "APPROVED")}
                className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-60"
                aria-label="approve request"
              >
                {updatingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "อนุมัติ"
                )}
              </button>

              <button
                onClick={() => setConfirmReject((s) => !s)}
                aria-expanded={confirmReject}
                className="px-4 py-2 rounded-md bg-red-600 text-white"
                aria-label="reject request"
              >
                ปฏิเสธ
              </button>
            </div>

            {confirmReject && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  เหตุผลการปฏิเสธ (จำเป็น)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border rounded-md p-2"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    disabled={!rejectReason.trim() || updatingId === request.id}
                    onClick={() =>
                      onAction(request.id, "REJECTED", { note: rejectReason })
                    }
                    className="px-4 py-2 rounded-md bg-red-700 text-white disabled:opacity-60"
                    aria-label="confirm reject"
                  >
                    ส่งการปฏิเสธ
                  </button>
                  <button
                    onClick={() => setConfirmReject(false)}
                    className="px-4 py-2 rounded-md bg-gray-100"
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
