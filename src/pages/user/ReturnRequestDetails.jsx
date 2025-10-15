import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReturnRequest } from "../../api/user";
import useEcomStore from "../../store/ecom-store";

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
          <div className="text-sm text-gray-700">{data.status}</div>
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
    </div>
  );
};

export default ReturnRequestDetails;
