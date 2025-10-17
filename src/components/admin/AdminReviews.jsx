import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import useEcomStore from "../../store/ecom-store";
import {
  Star,
  MessageSquareMore,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  UserRound,
  Filter,
  ArrowLeft,
  ArrowRight,
  Download,
  Search,
  Users,
} from "lucide-react"; // เพิ่มไอคอนเพิ่มเติม

const API = import.meta.env.VITE_API || "";

// 1. RatingStars: คอมโพเนนต์แสดงผลดาว
const RatingStars = ({ rating = 0 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

// 2. useDebounce: ไม่มีการเปลี่ยนแปลง, ยังคงทำงานได้ดี
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// 3. AdminReviews Component
export default function AdminReviews() {
  const token = useEcomStore((s) => s.token);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // *** ปรับปรุงการจัดการ Filter/Pagination ***
  const [filters, setFilters] = useState({
    search: "",
    rating: null, // ใช้ null แทน "" สำหรับ filter คะแนน
    page: 1,
    pageSize: 10,
  });

  const debouncedSearch = useDebounce(filters.search, 250);
  const [selected, setSelected] = useState([]);
  const [editingReply, setEditingReply] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    onConfirm: null,
  });

  // ฟังก์ชันสำหรับเปลี่ยน Filter และรีเซ็ตหน้าเป็น 1 เสมอ
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : prev.page, // รีเซ็ตหน้าเมื่อเปลี่ยนฟิลเตอร์อื่น
    }));
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // สามารถเพิ่มการส่ง parameters เพื่อทำ Server-Side Filtering ในอนาคต
      const res = await axios.get(`${API}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data.reviews || []);
    } catch {
      console.error("fetchReviews failed");
      setToast({ type: "error", text: "ดึงข้อมูลรีวิวไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Toast Cleanup
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Client-side Filtering & Pagination Logic
  const filtered = useMemo(() => {
    const q = (debouncedSearch || "").toLowerCase().trim();
    const ratingFilter = filters.rating;

    return reviews.filter((r) => {
      // Search logic
      const searchMatch =
        !q ||
        (
          String(r.id) +
          " " +
          (r.user?.email || "") +
          " " +
          (r.product?.title || r.product?.name || "") +
          " " +
          (r.comment || "")
        )
          .toLowerCase()
          .includes(q);

      // Rating filter logic
      const ratingMatch =
        ratingFilter === null || Number(r.rating) === ratingFilter;

      return searchMatch && ratingMatch;
    });
  }, [reviews, debouncedSearch, filters.rating]); // เพิ่ม filters.rating ใน dependency

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const pageItems = filtered.slice(
    (filters.page - 1) * filters.pageSize,
    filters.page * filters.pageSize
  );

  // เมื่อจำนวนหน้าเปลี่ยนและหน้าปัจจุบันเกินจำนวนหน้าทั้งหมด ให้ปรับหน้า
  useEffect(() => {
    if (filters.page > totalPages) {
      handleFilterChange("page", totalPages);
    }
  }, [totalPages, filters.page, handleFilterChange]);

  // Bulk/Select Handlers
  const toggleSelect = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  const selectPage = () => setSelected(pageItems.map((r) => r.id));
  const clearSelected = () => setSelected([]);

  // ... (ส่วนของ exportCSV, removeReview, handleBulkDelete, startEditReply, cancelEditReply, saveReply, deleteReply เหมือนเดิม) ...
  // การทำงานของฟังก์ชันเหล่านี้ยังคงดีอยู่แล้ว
  const exportCSV = () => {
    const rows = (
      selected.length
        ? reviews.filter((r) => selected.includes(r.id))
        : filtered
    ).map((r) => ({
      id: r.id,
      email: r.user?.email || "",
      product: r.product?.title || r.product?.name || "",
      rating: r.rating || "",
      comment: String(r.comment || "").replace(/\n/g, " "), // ป้องกัน newline ใน CSV
      reply: String(r.reply || "").replace(/\n/g, " "),
    }));
    if (!rows.length)
      return setToast({ type: "info", text: "ไม่มีข้อมูลสำหรับส่งออก" });

    // เพิ่ม Reply ใน Header
    const headers = ["id", "email", "product", "rating", "comment", "reply"];

    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((key) => `"${String(r[key]).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviews_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: "success", text: "ดาวน์โหลดเริ่มต้นแล้ว" });
  };

  const removeReview = async (id) => {
    if (!token) return setToast({ type: "error", text: "ต้องล็อกอิน" });
    setConfirm({
      open: true,
      title: "ยืนยันการลบรีวิว",
      onConfirm: async () => {
        setConfirm((s) => ({ ...s, open: false }));
        setActionLoading({ id, action: "delete" });
        try {
          await axios.delete(`${API}/review/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setToast({ type: "success", text: "ลบเรียบร้อย" });
          fetchReviews();
        } catch {
          console.error("removeReview failed");
          setToast({ type: "error", text: "ลบไม่สำเร็จ" });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (!token) return setToast({ type: "error", text: "ต้องล็อกอิน" });
    if (!selected.length)
      return setToast({ type: "info", text: "ไม่มีรีวิวที่เลือก" });
    setConfirm({
      open: true,
      title: `ลบ ${selected.length} รีวิว ที่เลือกหรือไม่?`,
      onConfirm: async () => {
        setConfirm((s) => ({ ...s, open: false }));
        setActionLoading({ id: selected.join(","), action: "bulk_delete" });
        try {
          // try single bulk endpoint first
          await axios.delete(`${API}/admin/reviews`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { ids: selected },
          });
          setToast({ type: "success", text: "ลบเรียบร้อย" });
          setSelected([]);
          fetchReviews();
        } catch (error) {
          // fallback: delete one-by-one
          // (คงไว้ตามโค้ดเดิม แต่ควรพยายามให้มี bulk endpoint)
          try {
            await Promise.all(
              selected.map((id) =>
                axios.delete(`${API}/review/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
              )
            );
            setToast({ type: "success", text: "ลบเรียบร้อย" });
            setSelected([]);
            fetchReviews();
          } catch (e) {
            console.error("bulk fallback failed", e);
            setToast({
              type: "error",
              text: "ลบไม่สำเร็จ (เกิดข้อผิดพลาดในการ fallback)",
            });
          }
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const startEditReply = (id, existing = "") =>
    setEditingReply((s) => ({ ...s, [id]: existing }));
  const cancelEditReply = (id) =>
    setEditingReply((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });

  const saveReply = async (id) => {
    if (!token) return setToast({ type: "error", text: "ต้องล็อกอิน" });
    const text = (editingReply[id] || "").trim();
    if (!text)
      return setToast({ type: "info", text: "ข้อความตอบกลับว่างเปล่า" });
    setActionLoading({ id, action: "reply" });
    try {
      await axios.post(
        `${API}/admin/reviews/${id}/reply`,
        { reply: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ type: "success", text: "ตอบกลับเรียบร้อย" });
      cancelEditReply(id);
      fetchReviews();
    } catch {
      console.error("saveReply failed");
      setToast({ type: "error", text: "บันทึกไม่สำเร็จ" });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReply = async (id) => {
    if (!token) return setToast({ type: "error", text: "ต้องล็อกอิน" });
    setConfirm({
      open: true,
      title: "ยืนยันการลบการตอบกลับ",
      onConfirm: async () => {
        setConfirm((s) => ({ ...s, open: false }));
        setActionLoading({ id, action: "delete_reply" });
        try {
          await axios.delete(`${API}/admin/reviews/${id}/reply`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setToast({ type: "success", text: "ลบการตอบกลับเรียบร้อย" });
          fetchReviews();
        } catch {
          console.error("deleteReply failed");
          setToast({ type: "error", text: "ลบไม่สำเร็จ" });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Stats Calculations
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    const s = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Math.round((s / reviews.length) * 10) / 10;
  }, [reviews]);
  const ratingCounts = useMemo(() => {
    const c = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rr = Number(r.rating) || 0;
      if (rr >= 1 && rr <= 5) c[rr] = (c[rr] || 0) + 1;
    });
    return c;
  }, [reviews]);

  // UI: Components & Layout
  return (
    <div className="min-h-screen w-full px-4 sm:px-6 py-6 bg-gray-50">
      {/* --- HEADER & STATS --- */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm mb-6 shadow-sm border-b">
        <div className="flex items-center justify-between py-4 px-2">
          <div className="flex items-center gap-3">
            <MessageSquareMore className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-extrabold text-gray-900">
              ศูนย์จัดการรีวิวลูกค้า
            </h2>
          </div>
          <div className="text-base font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full shadow-sm">
            {reviews.length} รีวิวทั้งหมด
          </div>
        </div>

        <div className="p-4 bg-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="p-3 bg-white rounded-lg shadow-md border flex flex-col items-center">
              <span className="text-xs text-gray-500">คะแนนเฉลี่ยรวม</span>
              <div className="text-3xl font-extrabold text-blue-600 flex items-end">
                {avgRating}{" "}
                <span className="text-base text-gray-500 ml-1">/5</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                จาก {reviews.length} รีวิว
              </div>
            </div>
            {/* Rating Buttons/Filters */}
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    handleFilterChange(
                      "rating",
                      filters.rating === n ? null : n
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filters.rating === n
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {n}★ ({ratingCounts[n] || 0})
                </button>
              ))}
              <button
                onClick={() => handleFilterChange("rating", null)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border hover:bg-gray-50 text-gray-600"
              >
                <Filter className="w-4 h-4 inline mr-1" />
                ล้างฟิลเตอร์
              </button>
            </div>
          </div>

          {/* Search and PageSize */}
          <div className="w-full lg:w-auto flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="search"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="ค้นหารีวิว, อีเมล, ชื่อสินค้า..."
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={filters.pageSize}
              onChange={(e) =>
                handleFilterChange("pageSize", Number(e.target.value))
              }
              className="p-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value={5}>5 / หน้า</option>
              <option value={10}>10 / หน้า</option>
              <option value={25}>25 / หน้า</option>
            </select>
          </div>
        </div>
      </div>
      {/* --- BULK ACTIONS & PAGINATION SUMMARY --- */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
            <Check className="w-4 h-4 text-green-600" />
            {selected.length} รายการที่เลือก
          </div>

          {selected.length > 0 && (
            <>
              <button
                onClick={clearSelected}
                className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-50"
              >
                ยกเลิกการเลือก
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition"
                disabled={
                  !selected.length || actionLoading?.action === "bulk_delete"
                }
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                ลบที่เลือก ({selected.length})
              </button>
            </>
          )}

         
          <button
            onClick={selectPage}
            className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-50"
          >
            เลือกหน้าปัจจุบัน ({pageItems.length})
          </button>
        </div>

        <div className="text-sm text-gray-600">
          แสดงผล {Math.min(total, (filters.page - 1) * filters.pageSize + 1)} -{" "}
          {Math.min(total, filters.page * filters.pageSize)} จาก {total} รีวิว
        </div>
      </div>

      {/* --- REVIEWS LIST --- */}
      {loading && total === 0 ? (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <div className="mt-2 text-lg text-gray-600">กำลังโหลดรีวิว...</div>
        </div>
      ) : pageItems.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-white shadow-md">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <div className="text-lg text-gray-600">
            ไม่พบรีวิวที่ตรงกับเงื่อนไข
          </div>
          <button
            onClick={() =>
              setFilters({ search: "", rating: null, page: 1, pageSize: 10 })
            }
            className="mt-4 text-blue-600 text-sm hover:underline"
          >
            รีเซ็ตตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pageItems.map((r) => {
            const isDeleting =
              actionLoading?.id === r.id && actionLoading?.action === "delete";
            const isReplying =
              actionLoading?.id === r.id &&
              (actionLoading?.action === "reply" ||
                actionLoading?.action === "delete_reply");
            const isEditing = editingReply[r.id] !== undefined;
            return (
              <div
                key={r.id}
                className={`p-5 bg-white rounded-xl shadow-lg transition duration-300 border-l-4 ${
                  selected.includes(r.id)
                    ? "border-blue-500 ring-4 ring-blue-100"
                    : r.reply
                    ? "border-green-300"
                    : "border-yellow-400" // เน้นรีวิวที่ยังไม่มีการตอบกลับ
                }`}
              >
                {/* Review Header */}
                <div className="flex items-start gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                          <UserRound className="w-4 h-4 text-blue-500" />
                          {r.user?.email || "ผู้ใช้งานไม่ระบุ"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {r.product?.title ||
                            r.product?.name ||
                            "ไม่ระบุสินค้า"}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <RatingStars rating={r.rating} />
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(
                            r.createdAt || r.date || Date.now()
                          ).toLocaleDateString("th-TH")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div className="text-sm text-gray-700 whitespace-pre-line border-t pt-3">
                  {r.comment}
                </div>

                {/* Admin Reply */}
                {r.reply && !isEditing && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
                    <span className="font-semibold text-blue-800">
                      ตอบกลับ:
                    </span>{" "}
                    {r.reply}
                  </div>
                )}

                {/* Reply/Action Area */}
                <div className="mt-4 border-t pt-3">
                  {isEditing ? (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <textarea
                        value={editingReply[r.id]}
                        onChange={(e) =>
                          setEditingReply((s) => ({
                            ...s,
                            [r.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="พิมพ์ข้อความตอบกลับ..."
                        className="w-full p-2 border rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => cancelEditReply(r.id)}
                          className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                        >
                          <X className="w-4 h-4 mr-1" /> ยกเลิก
                        </button>
                        <button
                          onClick={() => saveReply(r.id)}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                          disabled={isReplying}
                        >
                          {isReplying ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          {isReplying ? "กำลังบันทึก" : "บันทึกตอบกลับ"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <button
                        onClick={() => startEditReply(r.id, r.reply || "")}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                          r.reply
                            ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <Edit3 className="w-4 h-4 inline mr-1" />
                        {r.reply ? "แก้ไขตอบกลับ" : "ตอบกลับ"}
                      </button>
                      {r.reply && (
                        <button
                          onClick={() => deleteReply(r.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                          disabled={isReplying}
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      )}
                      <button
                        onClick={() => removeReview(r.id)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- PAGINATION CONTROLS --- */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => handleFilterChange("page", filters.page - 1)}
          disabled={filters.page <= 1}
          className="p-2 bg-white border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          aria-label="หน้าก่อนหน้า"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-base text-gray-700 font-medium">
          หน้า {filters.page} / {totalPages}
        </div>

        <button
          onClick={() => handleFilterChange("page", filters.page + 1)}
          disabled={filters.page >= totalPages}
          className="p-2 bg-white border rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          aria-label="หน้าถัดไป"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* --- CONFIRM MODAL --- */}
      {confirm?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
            <div className="text-xl font-extrabold mb-3 text-gray-900">
              {confirm.title || "ยืนยันการดำเนินการ"}
            </div>
            <div className="text-sm text-gray-600 mb-6">
              โปรดยืนยันการกระทำนี้ การกระทำนี้ไม่สามารถย้อนกลับได้
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirm((s) => ({ ...s, open: false }))}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm && confirm.onConfirm();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-opacity duration-300 ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
