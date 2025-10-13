import React from "react";
import { Loader2, User, Clock, Package } from "lucide-react"; // เพิ่มไอคอนเพื่อความชัดเจน

// 1. StatusBadge: ปรับปรุงให้มีไอคอนและใช้สีที่เป็นมาตรฐาน UI
// Accept either English codes (PENDING/APPROVED/REJECTED) or Thai labels and
// normalize to English codes for logic, but render Thai labels in the UI.
const StatusBadge = ({ status }) => {
  const raw = status || "";
  const s = (raw || "").toString().toUpperCase();
  // normalize Thai labels to English codes
  const normalized =
    s === "รอดำเนินการ" || s === "PENDING"
      ? "PENDING"
      : s === "อนุมัติแล้ว" || s === "APPROVED"
      ? "APPROVED"
      : s === "ถูกปฏิเสธ" || s === "REJECTED"
      ? "REJECTED"
      : s;
  const map = {
    PENDING: {
      label: "รอดำเนินการ",
      class: "bg-amber-100 text-amber-800",
      icon: <Clock className="w-3 h-3" />,
    },
    APPROVED: {
      label: "อนุมัติแล้ว",
      class: "bg-green-100 text-green-800",
      icon: "✅",
    },
    REJECTED: {
      label: "ถูกปฏิเสธ",
      class: "bg-red-100 text-red-800",
      icon: "❌",
    },
  };
  const info = map[normalized] || map.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${info.class}`}
    >
      {info.icon && <span className="text-sm">{info.icon}</span>}
      {info.label}
    </span>
  );
};

const RequestCard = ({ req, onOpenDetail, onAction, updatingId }) => {
  const isUpdating = updatingId === req.id;
  const productCount = req.products?.length || 0;
  const firstProduct = req.products?.[0]?.product;
  // Normalize status for logic checks (treat Thai labels as equivalent)
  const s = (req.status || "").toString().toUpperCase();
  const normalizedStatus =
    s === "รอดำเนินการ" || s === "PENDING"
      ? "PENDING"
      : s === "อนุมัติแล้ว" || s === "APPROVED"
      ? "APPROVED"
      : s === "ถูกปฏิเสธ" || s === "REJECTED"
      ? "REJECTED"
      : s;
  const isApproved = normalizedStatus === "APPROVED";

  // ปรับการแสดงผลเหตุผลให้มีบรรทัดเดียว
  const truncatedReason = req.reason
    ? `${req.reason.slice(0, 50)}${req.reason.length > 50 ? "..." : ""}`
    : "ไม่มีเหตุผลระบุ";

  return (
    <div
      className="bg-white rounded-xl p-5 flex flex-col gap-4 shadow-lg hover:shadow-xl transition duration-300 border-l-4 border-blue-500"
      // ใช้ border-l-4 เพื่อเน้นว่าเป็น Card ที่สำคัญ
    >
      {/* --- HEADER & STATUS --- */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            คำร้อง #<span className="text-blue-600">{req.id}</span>
          </h3>
          <StatusBadge status={req.status} />
        </div>

        {/* Thumbnail of the first product */}
        <img
          src={firstProduct?.image || "/no-image.png"}
          alt={firstProduct?.title || "Product Image"}
          loading="lazy"
          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-100 shadow-sm"
        />
      </div>

      {/* --- DETAILS SECTION --- */}
      <div className="flex-1 space-y-2 text-sm text-gray-700 border-t pt-3">
        <p className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium">ลูกค้า:</span>{" "}
          {req.user?.email || "ไม่ระบุ"}
        </p>
        <p className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="font-medium">ยื่นเมื่อ:</span>{" "}
          {new Date(req.createdAt).toLocaleDateString("th-TH")}
        </p>
        <p className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="font-medium">สินค้า:</span> {productCount} รายการ
        </p>
        <p className="mt-2 text-gray-600 italic line-clamp-2">
          <span className="font-semibold text-gray-800">เหตุผล:</span>{" "}
          {truncatedReason}
        </p>
      </div>

      {/* --- ACTIONS --- */}
      <div className="flex gap-3 pt-3 border-t">
        {/* ดูรายละเอียด (Primary Button) */}
        <button
          onClick={() => onOpenDetail(req)}
          className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition duration-150 shadow-md"
          aria-label={`ดูรายละเอียดคำร้อง ${req.id}`}
        >
          ดูรายละเอียด
        </button>

        {/* อนุมัติ (Secondary Action, Visible for PENDING only) */}
        {normalizedStatus === "PENDING" && (
          <button
            disabled={isUpdating}
            // send English code to handler for consistency
            onClick={() => onAction(req.id, "APPROVED")}
            className="w-24 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
            aria-label={`อนุมัติคำร้อง ${req.id}`}
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "อนุมัติ"
            )}
          </button>
        )}

        {/* ถ้า Approved แล้ว ให้แสดงปุ่มที่ใช้งานไม่ได้ */}
        {isApproved && (
          <button
            disabled
            className="w-24 px-4 py-2 rounded-lg bg-gray-400 text-white font-semibold opacity-70 cursor-default"
          >
            อนุมัติแล้ว
          </button>
        )}
      </div>
    </div>
  );
};

export default RequestCard;
