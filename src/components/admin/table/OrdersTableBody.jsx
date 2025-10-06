import React from "react";
import {
  Loader2,
  FileText,
  Trash2,
  Printer,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { numberFormat } from "../../../utils/number";

export default function OrdersTableBody({
  paginatedOrders = [],
  startIndex = 0,
  filteredOrders = [],
  pageSize = 10,
  current = 1,
  totalPages = 1,
  setCurrentPage,
  dateFormat,
  setViewOrder,
  handleChangeOrderStatus,
  handleDeleteOrder,
  handlePrintOrder,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col style={{ width: "48px" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "80px" }} />
        </colgroup>

        {/* Table Header */}
        <thead>
          <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wide">
            <th className="px-3 py-3 text-center font-semibold">#</th>
            <th className="px-3 py-3 text-left font-semibold">
              ลูกค้า / Order ID
            </th>
            <th className="px-3 py-3 text-center font-semibold">วันที่</th>
            <th className="px-3 py-3 text-left font-semibold">สินค้า</th>
            <th className="px-3 py-3 text-right font-semibold">ยอดรวม</th>
            <th className="px-3 py-3 text-center font-semibold">สถานะ</th>
            <th className="px-3 py-3 text-center font-semibold">การกระทำ</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-gray-100">
          {paginatedOrders.map((item, index) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              {/* Index */}
              <td className="px-4 py-3 text-center font-medium text-gray-600">
                {startIndex + index + 1}
              </td>

              {/* Customer */}
              <td className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ring-1 ring-gray-100">
                  {item.orderedBy?.picture ? (
                    <img
                      src={item.orderedBy.picture}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-sm font-semibold text-gray-600">
                      {getInitials(
                        item.name || item.orderedBy?.email || item.address?.name
                      )}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div
                    className="font-semibold text-gray-900 cursor-pointer hover:text-sky-600"
                    onClick={() => setViewOrder(item)}
                    title="ดูรายละเอียดคำสั่งซื้อ"
                  >
                    {item.name ||
                      item.address?.name ||
                      item.orderedBy?.email ||
                      "ไม่ระบุ"}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    ID: {item.id}
                  </div>
                </div>
              </td>

              {/* Date */}
              <td className="px-4 py-3 text-center">
                <span className="inline-block bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {dateFormat(item.createdAt)}
                </span>
              </td>

              {/* Products */}
              <td className="px-4 py-3">
                <div className="space-y-2">
                  {item.products.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="font-bold text-gray-600">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-gray-800 truncate"
                          title={p.product.title}
                        >
                          {p.product.title}
                          {p.variant?.title && (
                            <span className="text-xs text-gray-500 ml-2">
                              — {p.variant.title}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {p.product.category?.name &&
                            `หมวดหมู่: ${p.product.category.name}`}
                          {p.variant?.sku && (
                            <div className="text-xs text-gray-400 mt-1">
                              SKU: {p.variant.sku}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right min-w-[82px]">
                        <span className="block text-xs font-semibold text-gray-700">
                          {p.count} x{" "}
                          {numberFormat(
                            p.price || p.variant?.price || p.product?.price
                          )}
                        </span>
                        <span className="text-xs text-gray-400">
                          รวม{" "}
                          {numberFormat(
                            p.count *
                              (p.price || p.variant?.price || p.product?.price)
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </td>

              {/* Total */}
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                {numberFormat(item.cartTotal)}
              </td>

              {/* Status */}
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColorForRow(
                    item.orderStatus
                  )}`}
                >
                  {translateStatusForRow(item.orderStatus)}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {item.orderStatus === "CANCELLED" && (
                    <button
                      onClick={() => handleDeleteOrder(item.id)}
                      className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition text-sm"
                      title="ลบคำสั่งซื้อ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {item.orderStatus === "DELIVERED" && (
                    <button
                      onClick={() => handlePrintOrder(item)}
                      className="p-2 rounded-md bg-sky-50 text-sky-600 hover:bg-sky-100 transition text-sm"
                      title="พิมพ์ใบสั่งซื้อ"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select
                    className="w-full border rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white appearance-none pr-8"
                    value={translateStatusSelectValue(item.orderStatus)}
                    onChange={(e) =>
                      handleChangeOrderStatus(item.id, e.target.value)
                    }
                    aria-label="เปลี่ยนสถานะคำสั่งซื้อ"
                  >
                    <option value="รอดำเนินการ">รอดำเนินการ</option>
                    <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                    <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                    <option value="ยกเลิก">ยกเลิก</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 top-0 flex items-center text-gray-400">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3"
                    >
                      <path
                        d="M6 8L10 12L14 8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
        <div className="text-gray-600">
          แสดง {startIndex + 1} -{" "}
          {Math.min(startIndex + pageSize, filteredOrders.length)} จาก{" "}
          {filteredOrders.length} รายการ
        </div>
        <div className="flex items-center gap-3">
          {/* pageSize is controlled in OrdersToolbar - keep footer compact */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-md border text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={current <= 1}
          >
            ก่อนหน้า
          </button>
          <span className="font-medium text-gray-700">
            หน้า {current} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-md border text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={current >= totalPages}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}

/* Helpers */
function getStatusColorForRow(status) {
  switch (status) {
    case "NOT_PROCESSED":
    case "รอดำเนินการ":
      return "bg-gray-100 text-gray-600";
    case "PROCESSING":
    case "กำลังดำเนินการ":
      return "bg-yellow-100 text-yellow-700";
    case "DELIVERED":
    case "จัดส่งสำเร็จ":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
    case "ยกเลิก":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function translateStatusForRow(status) {
  switch (status) {
    case "NOT_PROCESSED":
    case "รอดำเนินการ":
      return (
        <>
          <Clock className="w-4 h-4" /> รอดำเนินการ
        </>
      );
    case "PROCESSING":
    case "กำลังดำเนินการ":
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> กำลังดำเนินการ
        </>
      );
    case "DELIVERED":
    case "จัดส่งสำเร็จ":
      return (
        <>
          <CheckCircle2 className="w-4 h-4" /> จัดส่งสำเร็จ
        </>
      );
    case "CANCELLED":
    case "ยกเลิก":
      return (
        <>
          <XCircle className="w-4 h-4" /> ยกเลิก
        </>
      );
    default:
      return status;
  }
}

function translateStatusSelectValue(status) {
  switch (status) {
    case "NOT_PROCESSED":
      return "รอดำเนินการ";
    case "PROCESSING":
      return "กำลังดำเนินการ";
    case "DELIVERED":
      return "จัดส่งสำเร็จ";
    case "CANCELLED":
      return "ยกเลิก";
    default:
      return "รอดำเนินการ";
  }
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.toString().trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
