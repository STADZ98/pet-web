import React from "react";
import { Loader2 } from "lucide-react";

const StatusBadge = ({ status }) => {
  const s = (status || "").toUpperCase();
  const map = {
    PENDING: { label: "รอดำเนินการ", class: "bg-amber-100 text-amber-800" },
    APPROVED: { label: "อนุมัติแล้ว", class: "bg-green-100 text-green-800" },
    REJECTED: { label: "ถูกปฏิเสธ", class: "bg-red-100 text-red-800" },
  };
  const info = map[s] || map.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-semibold ${info.class}`}
    >
      {info.label}
    </span>
  );
};

const RequestCard = ({ req, onOpenDetail, onAction, updatingId }) => {
  return (
    <div className="bg-white border rounded-md p-4 flex flex-col sm:flex-row gap-4 items-start shadow-sm">
      <img
        src={req.products?.[0]?.product?.image || "/no-image.png"}
        alt={req.products?.[0]?.product?.title || "thumb"}
        loading="lazy"
        className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-md border"
      />

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold">
              {req.user?.email || "ไม่ทราบ"}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(req.createdAt).toLocaleString("th-TH")}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              {req.reason
                ? `${req.reason.slice(0, 80)}${
                    req.reason.length > 80 ? "..." : ""
                  }`
                : "ไม่มีเหตุผล"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={req.status} />
            <div className="flex gap-2">
              <button
                onClick={() => onOpenDetail(req)}
                className="text-sm px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200"
                aria-label={`ดูรายละเอียดคำร้อง ${req.id}`}
              >
                ดูรายละเอียด
              </button>
              <button
                disabled={updatingId === req.id || req.status === "APPROVED"}
                onClick={() => onAction(req.id, "APPROVED")}
                className="text-sm px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-60"
                aria-label={`อนุมัติคำร้อง ${req.id}`}
              >
                {updatingId === req.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "อนุมัติ"
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          สินค้าจำนวน {req.products?.length || 0}
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
