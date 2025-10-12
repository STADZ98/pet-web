import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import {
  getReturnRequestsAdmin,
  updateReturnRequestStatus,
} from "../../api/admin";

const ReturnRequests = () => {
  const token = useEcomStore((s) => s.token);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getReturnRequestsAdmin(token, { perPage: 50 });
      setRequests(res.data.returnRequests || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load return requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleUpdate = async (id, status) => {
    if (!token) return alert("ต้องล็อกอินเป็นแอดมิน");
    try {
      await updateReturnRequestStatus(token, id, { status });
      fetch();
    } catch (e) {
      console.error(e);
      alert("อัปเดตไม่สำเร็จ");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">ร้องขอคืนสินค้า</h2>
      {loading ? (
        <div>Loading...</div>
      ) : requests.length === 0 ? (
        <div>No return requests</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="p-4 border rounded-lg flex flex-col md:flex-row md:justify-between gap-3"
            >
              <div>
                <div className="font-semibold">Request #{r.id}</div>
                <div className="text-sm text-gray-600">
                  User: {r.user?.email}
                </div>
                <div className="text-sm text-gray-600">Order: {r.orderId}</div>
                <div className="text-sm">Status: {r.status}</div>
                <div className="text-sm text-gray-700">
                  Reason: {r.reason}{" "}
                  {r.customReason ? `(${r.customReason})` : ""}
                </div>
                <div className="text-sm mt-2">
                  Products:
                  <ul className="list-disc pl-5">
                    {Array.isArray(r.products) &&
                      r.products.map((p) => (
                        <li key={p.id}>{p.product?.title || p.productId}</li>
                      ))}
                  </ul>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.status !== "APPROVED" && (
                  <button
                    onClick={() => handleUpdate(r.id, "APPROVED")}
                    className="px-3 py-2 bg-green-500 text-white rounded"
                  >
                    Approve
                  </button>
                )}
                {r.status !== "REJECTED" && (
                  <button
                    onClick={() => handleUpdate(r.id, "REJECTED")}
                    className="px-3 py-2 bg-red-500 text-white rounded"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnRequests;
