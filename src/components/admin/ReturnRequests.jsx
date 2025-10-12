import React, { useEffect, useState, useCallback } from "react";
import {
  getReturnRequestsAdmin,
  updateReturnRequestStatus,
  API,
} from "../../api/admin";
import { Loader2 } from "lucide-react";
import useEcomStore from "../../store/ecom-store";

// ✅ ฟังก์ชันช่วยจัดการ URL ภาพทุกกรณี
const getImageSrc = (image) => {
  if (!image) return "/no-image.png";

  // กรณี backend ส่ง base64 ที่มี prefix URL ผิด เช่น https://server-api.../api/data:image/...
  if (image.startsWith("https://") && image.includes("data:image")) {
    const base64Part = image.split("/api/")[1];
    if (base64Part && base64Part.startsWith("data:image")) {
      return base64Part;
    }
  }

  // base64 ปกติ
  if (image.startsWith("data:image")) return image;

  // URL เต็ม
  if (image.startsWith("http")) return image;

  // path ธรรมดา เช่น /uploads/xxx.jpg
  return `${API.replace("/api", "")}${image}`;
};

const ReturnRequests = () => {
  const token = useEcomStore((s) => s.token);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getReturnRequestsAdmin(token);
      console.debug(
        "[DEBUG] getReturnRequestsAdmin response:",
        res?.data?.returnRequests
      );
      setRequests(res?.data?.returnRequests || []);
    } catch (err) {
      console.error("Failed to fetch return requests:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchRequests();
  }, [token, fetchRequests]);

  const handleUpdateStatus = async (id, newStatus) => {
    // Server expects uppercase status labels: PENDING, APPROVED, REJECTED
    const mappedStatus =
      typeof newStatus === "string" ? newStatus.toUpperCase() : newStatus;
    try {
      setUpdating(id);
      // Debug: log outgoing payload
      console.debug("[DEBUG] updateReturnRequestStatus payload:", {
        id,
        status: mappedStatus,
      });
      await updateReturnRequestStatus(token, id, { status: mappedStatus });
      // update local state to reflect server value (uppercase)
      setRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: mappedStatus } : req
        )
      );
    } catch (err) {
      // Log full Axios error details so we can see response body/status
      console.error(
        "Failed to update status:",
        err && err.toJSON ? err.toJSON() : err
      );
      if (err && err.response) {
        console.error(
          "Server response (status, data):",
          err.response.status,
          err.response.data
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin mr-2" />
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold mb-4">คำร้องขอคืนสินค้า</h2>
      {requests.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีคำร้องขอคืนสินค้า</p>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="shadow-sm border rounded-lg">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="font-semibold">
                    ผู้ใช้: {req.user?.email || "ไม่ทราบ"}
                  </p>
                  <p className="text-sm text-gray-500">
                    วันที่: {new Date(req.createdAt).toLocaleString("th-TH")}
                  </p>
                  <p className="text-sm text-gray-500">
                    สถานะ:{" "}
                    <span
                      className={`font-medium ${
                        req.status === "approved"
                          ? "text-green-600"
                          : req.status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {req.status === "APPROVED"
                        ? "อนุมัติแล้ว"
                        : req.status === "REJECTED"
                        ? "ถูกปฏิเสธ"
                        : "รอดำเนินการ"}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={updating === req.id || req.status === "APPROVED"}
                    onClick={() => handleUpdateStatus(req.id, "APPROVED")}
                    className="px-3 py-1 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
                  >
                    {updating === req.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "อนุมัติ"
                    )}
                  </button>
                  <button
                    disabled={updating === req.id || req.status === "REJECTED"}
                    onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                    className="px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                  >
                    {updating === req.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "ปฏิเสธ"
                    )}
                  </button>
                </div>
              </div>

              {/* แสดงสินค้า */}
              <div className="border-t pt-3 space-y-2">
                <p className="font-medium mb-2">สินค้าที่ขอคืน:</p>
                {req.products?.length ? (
                  req.products.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 border p-2 rounded-md"
                    >
                      <img
                        src={getImageSrc(
                          item?.product?.image ||
                            item?.product?.images?.[0] ||
                            item?.image
                        )}
                        alt={item?.product?.title || "สินค้า"}
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                      <div>
                        <p className="font-semibold">
                          {item?.product?.title || "ไม่ทราบชื่อสินค้า"}
                        </p>
                        <p className="text-sm text-gray-500">
                          จำนวน: {item.count || 1}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">ไม่มีข้อมูลสินค้า</p>
                )}
              </div>

              {/* เหตุผล */}
              {req.reason && (
                <div className="mt-3 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">เหตุผล:</span> {req.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ReturnRequests;
