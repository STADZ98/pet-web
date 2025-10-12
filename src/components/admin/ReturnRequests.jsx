import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import {
  getReturnRequestsAdmin,
  updateReturnRequestStatus,
  API,
} from "../../api/admin";
import {
  RefreshCw,
  Ban,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Box,
  Hash,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ✅ normalize image URL
const normalizeImageUrl = (input) => {
  if (!input) return null;
  let url = "";

  if (typeof input === "string") {
    url = input;
  } else if (typeof input === "object") {
    url =
      input.secure_url ||
      input.url ||
      input.path ||
      input.image ||
      input.imageUrl ||
      input?.product?.image ||
      input?.product?.images?.[0] ||
      "";
  }

  if (!url) return null;

  // ถ้าไม่มี protocol ให้เติม https://
  if (!/^https?:\/\//i.test(url)) {
    url = url.startsWith("/") ? `${API}${url}` : `${API}/${url}`;
  }

  return url.replace(/^http:\/\//i, "https://");
};

// Helper function for status styling
const getStatusBadge = (status) => {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-yellow-800 bg-yellow-100 rounded-full">
          <Clock className="w-4 h-4" /> รอดำเนินการ
        </span>
      );
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
          <CheckCircle className="w-4 h-4" /> อนุมัติแล้ว
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
          <XCircle className="w-4 h-4" /> ไม่อนุมัติ
        </span>
      );
    case "REFUNDED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
          <CheckCircle className="w-4 h-4" /> คืนเงินสำเร็จ
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-100 rounded-full">
          <AlertTriangle className="w-4 h-4" /> {status}
        </span>
      );
  }
};

const ReturnRequests = () => {
  const token = useEcomStore((s) => s.token);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [detailOpenFor, setDetailOpenFor] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  const fetch = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getReturnRequestsAdmin(token, { perPage: 50 });
      const sortedRequests = (res.data.returnRequests || []).sort((a, b) => {
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (a.status !== "PENDING" && b.status === "PENDING") return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setRequests(sortedRequests);
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถโหลดคำขอคืนสินค้าได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [token]);

  const handleUpdate = async (id, status) => {
    if (!token) return alert("ต้องล็อกอินเป็นแอดมิน");
    if (
      !window.confirm(
        `คุณแน่ใจจะ ${
          status === "APPROVED" ? "อนุมัติ" : "ไม่อนุมัติ"
        } คำขอคืนสินค้า #${id} ?`
      )
    ) {
      return;
    }

    setProcessingId(id);
    try {
      await updateReturnRequestStatus(token, id, { status, adminNote });
      setRequests(requests.map((r) => (r.id === id ? { ...r, status } : r)));
      setTimeout(fetch, 500);
    } catch (e) {
      console.error(e);
      alert("อัปเดตสถานะไม่สำเร็จ");
      fetch();
    } finally {
      setProcessingId(null);
    }
  };

  const openDetails = (r) => {
    setAdminNote(r.adminNote || "");
    setDetailOpenFor(r.id);
  };

  const closeDetails = () => {
    setDetailOpenFor(null);
    setAdminNote("");
  };

  const NO_IMAGE_DATA_URL =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><path d='M3 15l4-4 4 4 6-6 4 4'/></svg>";

  const getImageSrc = (p) => {
    if (!p) return null;
    const candidates = [
      p.image,
      p.images?.[0],
      p.productImage,
      p.variantImage,
      p.product?.image,
      p.product?.images?.[0],
      p.variant?.image,
      p.variant?.images?.[0],
      p.imageUrl,
      p.secure_url,
      p.url,
      p.path,
    ].filter(Boolean);

    let url = candidates.find(
      (x) => typeof x === "string" && x.trim().length > 0
    );
    if (!url) return null;

    if (!/^https?:\/\//i.test(url)) {
      if (url.startsWith("/")) url = `${API}${url}`;
      else url = `${API}/${url}`;
    }

    return url.replace(/^http:\/\//i, "https://");
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = NO_IMAGE_DATA_URL;
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-3">
        <div className="flex items-center gap-2">
          <Ban className="w-7 h-7 text-red-600" />
          <h2 className="text-2xl font-extrabold text-gray-900">
            คำร้องขอคืนสินค้าและการคืนเงิน
          </h2>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          รีเฟรช
        </button>
      </div>

      {/* Content */}
      {loading && requests.length === 0 ? (
        <div className="py-12 text-center text-red-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="mt-3 font-medium">กำลังโหลดคำขอคืนสินค้า...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center text-gray-500 border border-dashed rounded-lg bg-gray-50">
          <Box className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">ยังไม่มีคำร้องขอคืนสินค้าในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((r) => {
            const isProcessing = processingId === r.id;
            return (
              <div
                key={r.id}
                className="p-5 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-md transition duration-200"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-gray-500" />
                        <span className="text-xl font-bold text-red-600">
                          คำขอ #{r.id}
                        </span>
                      </div>
                      {getStatusBadge(r.status)}
                    </div>

                    <div className="text-sm text-gray-700 mt-2">
                      <Mail className="inline w-4 h-4 mr-1 text-gray-400" />
                      ผู้ใช้: {r.user?.email || "N/A"}
                    </div>
                    <div className="text-sm text-gray-700">
                      <Box className="inline w-4 h-4 mr-1 text-gray-400" />
                      คำสั่งซื้อ: {r.orderId}
                    </div>

                    <div className="text-sm font-semibold text-gray-800 pt-1">
                      เหตุผล: {r.reason}
                      {r.customReason && (
                        <span className="text-gray-500 font-normal">
                          {" "}
                          ({r.customReason})
                        </span>
                      )}
                    </div>

                    <div className="font-medium">สินค้าที่ขอคืน:</div>
                    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Array.isArray(r.products) &&
                        r.products.map((p) => {
                          const img = getImageSrc(p);
                          const title = p.product?.title || `#${p.productId}`;
                          return (
                            <li
                              key={p.id}
                              className="flex items-center gap-3 bg-white p-2 rounded-md border border-gray-100"
                            >
                              {img ? (
                                <img
                                  src={img}
                                  alt={title}
                                  onError={handleImageError}
                                  className="w-14 h-14 rounded-md object-cover border"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center text-gray-300 text-xs border">
                                  ไม่มีรูป
                                </div>
                              )}
                              <div className="text-xs">
                                <div className="font-semibold text-gray-800 truncate max-w-[140px]">
                                  {title}
                                </div>
                                <div className="text-gray-500">
                                  {p.count ? `x${p.count}` : ""}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0 min-w-[120px]">
                    <button
                      onClick={() => openDetails(r)}
                      className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-md hover:shadow-sm"
                    >
                      รายละเอียด
                    </button>

                    {r.status !== "APPROVED" && r.status !== "REJECTED" && (
                      <>
                        <button
                          onClick={() => handleUpdate(r.id, "APPROVED")}
                          disabled={isProcessing}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                            isProcessing
                              ? "bg-blue-200 text-blue-600"
                              : "bg-green-600 text-white hover:bg-green-700 shadow-md"
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          อนุมัติ
                        </button>

                        <button
                          onClick={() => handleUpdate(r.id, "REJECTED")}
                          disabled={isProcessing}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                            isProcessing
                              ? "bg-blue-200 text-blue-600"
                              : "bg-red-600 text-white hover:bg-red-700 shadow-md"
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          ไม่อนุมัติ
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReturnRequests;
