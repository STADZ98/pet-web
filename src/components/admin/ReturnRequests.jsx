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
import { normalizeImageUrl } from "./adminHelpers";

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
    case "REFUNDED": // Add a possible final status
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
  const [processingId, setProcessingId] = useState(null); // To disable buttons during update
  const [detailOpenFor, setDetailOpenFor] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  const fetch = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getReturnRequestsAdmin(token, { perPage: 50 });
      // Sort by status (PENDING first) and then date
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Optimistically update the status until refetch completes
      setRequests(requests.map((r) => (r.id === id ? { ...r, status } : r)));
      // Wait a moment then refetch to get clean data and handle any backend logic
      setTimeout(fetch, 500);
    } catch (e) {
      console.error(e);
      alert("อัปเดตสถานะไม่สำเร็จ");
      fetch(); // Refetch on error to restore state
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

  // image fallback and normalizer
  const NO_IMAGE_DATA_URL =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><path d='M3 15l4-4 4 4 6-6 4 4'/></svg>";

  const getImageSrc = (p) => normalizeImageUrl(p);

  // Try alternate image sources (secure_url, url, path) and API/origin variants before final fallback.
  // This async loader probes candidate URLs (including API variants and origin variants)
  // and only uses a URL after a successful load. If none succeed, it sets the inline SVG fallback.
  const handleImageError = async (e, p) => {
    const candidates = [];

    const pushFromEntry = (entry) => {
      if (!entry) return;
      if (typeof entry === "string") {
        candidates.push(entry);
        return;
      }
      if (Array.isArray(entry)) {
        for (const it of entry) pushFromEntry(it);
        return;
      }
      // object
      const fields = ["secure_url", "url", "path", "image", "src"];
      for (const f of fields) if (entry[f]) candidates.push(entry[f]);
      if (entry.data && typeof entry.data === "object") {
        const nested = entry.data.attributes || entry.data;
        for (const f of fields) if (nested[f]) candidates.push(nested[f]);
      }
    };

    // gather from product/variant/fallbacks
    pushFromEntry(p?.product);
    pushFromEntry(p?.variant);
    pushFromEntry(p?.product?.images || p?.product?.image);
    pushFromEntry(p?.variant?.images || p?.variant?.image);
    pushFromEntry(p?.image || p?.images || p?.productImage || p?.variantImage);

    const tried = new Set();

    const loadImage = (url) =>
      new Promise((resolve) => {
        try {
          const tmp = new Image();
          tmp.onload = () => resolve(true);
          tmp.onerror = () => resolve(false);
          tmp.src = url;
        } catch {
          resolve(false);
        }
      });

    const makeUrlVariants = (raw) => {
      if (!raw) return [];
      let s = String(raw).trim();
      if (!s) return [];
      const vars = [];

      // protocol-relative -> https
      if (/^\/\//.test(s)) vars.push(`https:${s}`);
      // upgrade http -> https
      if (/^http:\/\//i.test(s))
        vars.push(s.replace(/^http:\/\//i, "https://"));
      // absolute
      if (/^https?:\/\//i.test(s)) vars.push(s);

      // relative paths -> try API and origin variants
      if (!/^https?:\/\//i.test(s)) {
        const cleaned = s.replace(/^\//, "");
        try {
          const bases = [];
          if (API) bases.push(String(API));
          if (API && /\/api\/?$/i.test(API))
            bases.push(String(API).replace(/\/api\/?$/i, ""));
          if (typeof window !== "undefined" && window.location)
            bases.push(window.location.origin);
          // also try origin + /api in case images are served under /api
          if (typeof window !== "undefined" && window.location)
            bases.push(`${window.location.origin.replace(/\/$/, "")}/api`);

          for (let b of bases) {
            if (!b) continue;
            b = String(b).replace(/\/$/, "");
            vars.push(`${b}/${cleaned}`);
          }
        } catch (err) {
          // ignore window access errors
          void err;
        }
      }

      return vars;
    };

    for (const entry of candidates) {
      const variants = makeUrlVariants(entry);
      for (const v of variants) {
        if (!v) continue;
        const key = String(v);
        if (tried.has(key)) continue;
        tried.add(key);
        // probe the URL
        try {
          const ok = await loadImage(v);
          if (ok) {
            try {
              e.target.onerror = null;
            } catch (err) {
              void err;
            }
            e.target.src = v;
            return;
          }
        } catch (err) {
          // ignore and try next (probe failure)
          void err;
        }
      }
    }

    // final fallback
    try {
      e.target.onerror = null;
    } catch (err) {
      void err;
    }
    try {
      e.target.src = NO_IMAGE_DATA_URL;
    } catch (err) {
      // ignore (window access or other error)
      void err;
    }
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
                  {/* Request Info */}
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
                      **ผู้ใช้:** {r.user?.email || "N/A"}
                    </div>
                    <div className="text-sm text-gray-700">
                      <Box className="inline w-4 h-4 mr-1 text-gray-400" />
                      **คำสั่งซื้อ:** {r.orderId}
                    </div>

                    <div className="text-sm font-semibold text-gray-800 pt-1">
                      **เหตุผล:** {r.reason}
                      {r.customReason && (
                        <span className="text-gray-500 font-normal">
                          {" "}
                          ({r.customReason})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">**สินค้าที่ขอคืน:**</div>
                      <button
                        onClick={() => openDetails(r)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        ดูรายละเอียด
                      </button>
                    </div>
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
                                  onError={(e) => handleImageError(e, p)}
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

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0 min-w-[120px]">
                    <button
                      onClick={() => openDetails(r)}
                      className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-md hover:shadow-sm"
                    >
                      รายละเอียด
                    </button>
                    {/* Approve Button */}
                    {r.status !== "APPROVED" && r.status !== "REJECTED" && (
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
                    )}

                    {/* Reject Button */}
                    {r.status !== "APPROVED" && r.status !== "REJECTED" && (
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
                    )}

                    {/* Status Display if already finalized */}
                    {(r.status === "APPROVED" || r.status === "REJECTED") && (
                      <div className="text-xs text-center text-gray-500 pt-2">
                        ดำเนินการแล้วเมื่อ:{" "}
                        {new Date(
                          r.updatedAt || r.createdAt
                        ).toLocaleDateString("th-TH")}
                      </div>
                    )}

                    {isProcessing && (
                      <div className="text-xs text-center text-blue-600 font-medium">
                        กำลังอัปเดต...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Details Modal */}
          {detailOpenFor &&
            (() => {
              const rr = requests.find((x) => x.id === detailOpenFor);
              if (!rr) return null;
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b">
                      <div>
                        <h3 className="text-lg font-bold">
                          คำขอคืนสินค้า #{rr.id}
                        </h3>
                        <div className="text-sm text-gray-500">
                          โดย: {rr.user?.email || "-"} • คำสั่งซื้อ #
                          {rr.orderId}
                        </div>
                      </div>
                      <button
                        onClick={closeDetails}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">เหตุผล</div>
                          <div className="text-sm font-medium text-gray-800">
                            {rr.reason}
                            {rr.customReason ? ` (${rr.customReason})` : ""}
                          </div>

                          <div className="text-sm text-gray-600 pt-3">
                            สถานะ
                          </div>
                          <div>{getStatusBadge(rr.status)}</div>

                          <div className="text-sm text-gray-600 pt-3">
                            วันที่ส่งคำขอ
                          </div>
                          <div className="text-sm text-gray-800">
                            {new Date(rr.createdAt).toLocaleString("th-TH")}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            ข้อมูลผู้ขอคืน
                          </div>
                          <div className="text-sm text-gray-800">
                            {rr.user?.email || "-"}
                          </div>
                          <div className="text-sm text-gray-600 pt-2">
                            คำสั่งซื้อ
                          </div>
                          <div className="text-sm text-gray-800">
                            #{rr.orderId} • สถานะคำสั่งซื้อ:{" "}
                            {rr.order?.orderStatus || "-"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">
                          สินค้าที่ขอคืน
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Array.isArray(rr.products) &&
                            rr.products.map((p) => {
                              const img = getImageSrc(p);
                              const title =
                                p.product?.title || `#${p.productId}`;
                              return (
                                <div
                                  key={p.id}
                                  className="flex gap-3 items-center p-3 bg-gray-50 rounded-md border"
                                >
                                  {img ? (
                                    <img
                                      src={img}
                                      alt={title}
                                      onError={(e) => handleImageError(e, p)}
                                      className="w-20 h-20 rounded-md object-cover border"
                                    />
                                  ) : (
                                    <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-300">
                                      ไม่มีรูป
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800">
                                      {title}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      จำนวน: {p.count || 1}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600">
                          หมายเหตุของแอดมิน (จะบันทึกพร้อมการอัปเดตสถานะ)
                        </label>
                        <textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          className="mt-1 w-full min-h-[80px] p-2 border rounded-md"
                        />
                      </div>
                    </div>
                    <div className="p-4 border-t flex items-center justify-end gap-2">
                      <button
                        onClick={closeDetails}
                        className="px-4 py-2 bg-white border rounded-md"
                      >
                        ปิด
                      </button>
                      {rr.status !== "APPROVED" && rr.status !== "REJECTED" && (
                        <>
                          <button
                            onClick={() => {
                              setProcessingId(rr.id);
                              handleUpdate(rr.id, "REJECTED");
                              closeDetails();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md"
                          >
                            ไม่อนุมัติ
                          </button>
                          <button
                            onClick={() => {
                              setProcessingId(rr.id);
                              handleUpdate(rr.id, "APPROVED");
                              closeDetails();
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md"
                          >
                            อนุมัติ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
};

export default ReturnRequests;
