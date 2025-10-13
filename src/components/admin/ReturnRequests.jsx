import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getReturnRequestsAdmin,
  updateReturnRequestStatus,
  // API, // ไม่ได้ใช้, ลบออกเพื่อความสะอาด
} from "../../api/admin";
import { Loader2, Search } from "lucide-react"; // เพิ่ม Search icon
import useEcomStore from "../../store/ecom-store";
import RequestCard from "./RequestCard";
import RequestDetailModal from "./RequestDetailModal";
import Toasts from "../ui/Toast";

// small id generator using crypto.randomUUID with fallback
const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 9);
};

// Map status for display color and text
const statusOptions = [
  { value: "ALL", label: "ทั้งหมด", color: "text-gray-600 border-gray-400" },
  {
    value: "PENDING",
    label: "รอดำเนินการ",
    color: "text-blue-600 border-blue-400",
  },
  {
    value: "APPROVED",
    label: "อนุมัติแล้ว",
    color: "text-green-600 border-green-400",
  },
  {
    value: "REJECTED",
    label: "ถูกปฏิเสธ",
    color: "text-red-600 border-red-400",
  },
];

const ReturnRequests = () => {
  const token = useEcomStore((s) => s.token);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast functions
  const addToast = useCallback((t) => {
    const id = makeId();
    setToasts((s) => [...s, { id, ...t }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 5000);
  }, []);
  const removeToast = (id) => setToasts((s) => s.filter((x) => x.id !== id));

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
      addToast({ type: "error", message: "ดึงข้อมูลคำร้องล้มเหลว" });
    } finally {
      setLoading(false);
    }
  }, [token, addToast]); // addToast dependency for safety

  useEffect(() => {
    if (token) fetchRequests();
  }, [token, fetchRequests]);

  const handleUpdateStatus = async (id, newStatus, opts = {}) => {
    // Server expects uppercase status labels: PENDING, APPROVED, REJECTED
    const mappedStatus =
      typeof newStatus === "string" ? newStatus.toUpperCase() : newStatus;
    try {
      setUpdating(id);
      await updateReturnRequestStatus(token, id, {
        status: mappedStatus,
        note: opts.note, // ส่ง note (เหตุผลปฏิเสธ) ไปด้วย
      });
      // update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === id
            ? { ...req, status: mappedStatus, rejectionNote: opts.note }
            : req
        )
      );
      // if the modal is open for this id, update it too
      setSelectedRequest((s) =>
        s && s.id === id
          ? { ...s, status: mappedStatus, rejectionNote: opts.note }
          : s
      );
      // success toast
      const statusLabel =
        statusOptions.find((opt) => opt.value === mappedStatus)?.label ||
        mappedStatus;
      addToast({
        type: "success",
        message: `อัปเดตสถานะคำร้อง ${id} เป็น **${statusLabel}**`,
      });
    } catch (err) {
      console.error(
        "Failed to update status:",
        err && err.toJSON ? err.toJSON() : err
      );
      const errMsg = err?.response?.data?.message || err.message;
      addToast({
        type: "error",
        message: `การอัปเดตสถานะล้มเหลว: ${errMsg}`,
      });
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const isAllStatus = statusFilter === "ALL";

    return requests
      .filter((r) => {
        // 1. Filter by Status
        if (!isAllStatus && (r.status || "").toUpperCase() !== statusFilter)
          return false;

        // 2. Filter by Query
        if (!q) return true;
        const inEmail = r.user?.email?.toLowerCase().includes(q);
        const inReason = r.reason?.toLowerCase().includes(q);
        const inId = String(r.id).includes(q);
        return inEmail || inReason || inId;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // เรียงตามวันที่ล่าสุดก่อน
  }, [requests, query, statusFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-lg text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-blue-500" />
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 border-b pb-3 mb-4">
          จัดการคำร้องขอคืนสินค้า 📦
        </h1>

        {/* --- CONTROL BAR --- */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา: อีเมล, ID, หรือเหตุผล..."
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="status-filter"
              className="text-gray-600 font-medium whitespace-nowrap"
            >
              สถานะ:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8 transition duration-150"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- REQUEST LIST --- */}
      <div className="text-lg font-medium text-gray-700">
        พบคำร้องทั้งหมด:{" "}
        <span className="font-bold text-blue-600">{filtered.length}</span>{" "}
        รายการ
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <p className="text-gray-500 text-lg py-10">
            ไม่พบคำร้องขอคืนสินค้าที่ตรงกับเงื่อนไข 😔
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              onOpenDetail={(r) => setSelectedRequest(r)}
              onAction={handleUpdateStatus}
              updatingId={updating}
            />
          ))}
        </div>
      )}

      <RequestDetailModal
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onAction={handleUpdateStatus}
        updatingId={updating}
      />
      <Toasts toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ReturnRequests;
