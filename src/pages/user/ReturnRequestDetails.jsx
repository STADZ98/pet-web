import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReturnRequest } from "../../api/user";
import useEcomStore from "../../store/ecom-store";

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

const ReturnRequestDetails = () => {
  const { id } = useParams();
  const token = useEcomStore((s) => s.token) || localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const res = await getReturnRequest(token, id);
        setData(res.data.returnRequest || res.data.returnRequest || null);
      } catch (err) {
        console.error(err);
        // If unauthorized or not found, go back to history
        navigate("/user/history");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token, navigate]);

  if (loading) return <div className="p-6">กำลังโหลด...</div>;
  if (!data) return <div className="p-6">ไม่พบข้อมูลคำขอคืน</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">รายละเอียดคำขอคืนสินค้า</h1>
        <div className="text-sm text-gray-500">คำขอ #{data.id}</div>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold">สถานะ</div>
          <div
            className={`text-sm font-semibold px-3 py-1 rounded-full ${statusColor(
              data.status
            )}`}
          >
            {statusLabel(data.status)}
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-2">
          สร้างเมื่อ: {new Date(data.createdAt).toLocaleString()}
        </div>
        <div className="mb-2">
          <div className="font-semibold">เหตุผล</div>
          <div className="text-sm text-gray-700">
            {data.reason} {data.customReason ? `- ${data.customReason}` : ""}
          </div>
        </div>
        <div>
          <div className="font-semibold">คำสั่งซื้อที่เกี่ยวข้อง</div>
          <div className="text-sm text-gray-700">
            คำสั่งซื้อ #{data.order?.id || data.orderId}
          </div>
        </div>
        {data.handledAt && (
          <div className="mt-2 text-sm text-gray-600">
            จัดการแล้วเมื่อ: {new Date(data.handledAt).toLocaleString()}
          </div>
        )}
        {data.adminNote && (
          <div className="mt-2">
            <div className="font-semibold">หมายเหตุจากแอดมิน</div>
            <div className="text-sm text-gray-700">{data.adminNote}</div>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="font-semibold mb-2">สินค้าที่ขอคืน</div>
        <ul className="list-disc pl-5">
          {data.products.map((p) => (
            <li key={p.id} className="mb-2">
              <div className="font-medium">
                {p.product?.title || p.productId}
              </div>
              <div className="text-sm text-gray-600">
                Product ID: {p.productId}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="font-semibold mb-2">รูปภาพที่แนบ</div>
        <div className="grid grid-cols-3 gap-2">
          {data.images && data.images.length > 0 ? (
            data.images.map((img) => (
              <img
                key={img.id}
                src={`${import.meta.env.VITE_API || ""}/user/return-image/${
                  img.id
                }`}
                alt={img.filename || `img-${img.id}`}
                className="w-full h-36 object-cover rounded"
              />
            ))
          ) : (
            <div className="text-sm text-gray-500">ไม่มีรูป</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200"
        >
          ย้อนกลับ
        </button>
      </div>
    </div>
  );
};

export default ReturnRequestDetails;
