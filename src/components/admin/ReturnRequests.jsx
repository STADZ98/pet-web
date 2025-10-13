import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getReturnRequestsAdmin,
  updateReturnRequestStatus,
  API,
} from "../../api/admin";
import { Loader2 } from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import RequestCard from "./RequestCard";
import RequestDetailModal from "./RequestDetailModal";
import Toasts from "../ui/Toast";
import { v4 as uuidv4 } from "uuid";

// (image helper removed - component files use direct image fields or a shared util can be added later)

const ReturnRequests = () => {
  const token = useEcomStore((s) => s.token);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);

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
      // if the modal is open for this id, update it too
      setSelectedRequest((s) =>
        s && s.id === id ? { ...s, status: mappedStatus } : s
      );
      // success toast
      addToast({
        type: "success",
        message: `อัปเดตสถานะคำร้อง ${id} เป็น ${mappedStatus}`,
      });
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
        addToast({
          type: "error",
          message: `การอัปเดตสถานะล้มเหลว: ${
            err.response?.data?.message || err.message
          }`,
        });
      }
    } finally {
      setUpdating(null);
    }
  };

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (t) => {
    const id = uuidv4();
    setToasts((s) => [...s, { id, ...t }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 5000);
  };
  const removeToast = (id) => setToasts((s) => s.filter((x) => x.id !== id));
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const q = query.trim().toLowerCase();
      if (
        statusFilter !== "ALL" &&
        (r.status || "").toUpperCase() !== statusFilter
      )
        return false;
      if (!q) return true;
      const inEmail = r.user?.email?.toLowerCase().includes(q);
      const inReason = r.reason?.toLowerCase().includes(q);
      const inId = String(r.id).includes(q);
      return inEmail || inReason || inId;
    });
  }, [requests, query, statusFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin mr-2" />
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h2 className="text-2xl font-semibold">คำร้องขอคืนสินค้า</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาโดย อีเมล, id, เหตุผล"
            className="flex-1 md:flex-none border rounded-md px-3 py-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="PENDING">รอดำเนินการ</option>
            <option value="APPROVED">อนุมัติแล้ว</option>
            <option value="REJECTED">ถูกปฏิเสธ</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">ไม่พบคำร้องตามเงื่อนไข</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
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
        onAction={(id, status, opts) => handleUpdateStatus(id, status, opts)}
        updatingId={updating}
      />
      <Toasts toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ReturnRequests;
