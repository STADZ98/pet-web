import React, { useEffect, useState, useCallback, useMemo } from "react";
// -------------------- Dependencies --------------------
import axios from "axios";
import useEcomStore from "../../store/ecom-store";
// -------------------- Icons --------------------
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
  ArrowDown,
  ArrowUp,
} from "lucide-react";

// -------------------- Constants --------------------
const API =
  import.meta.env.VITE_API || "https://server-api-newgenz.vercel.app/api";

// -------------------- Small UI Helpers --------------------
const formatNumber = (n) => (typeof n === "number" ? n.toLocaleString() : "0");

// =================================================================
// --- Component: RatingStars (แยกออกมาเพื่อให้โค้ดดูสะอาดขึ้น) ---
// =================================================================
const RatingStars = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 transition-colors ${
            i < (rating || 0)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          }`}
          fill={i < (rating || 0) ? "currentColor" : "none"}
          strokeWidth={i < (rating || 0) ? 0 : 2}
        />
      ))}
    </div>
  );
};

// =================================================================
// --- Component: AdminReviews (Main Component) ---
// =================================================================
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const AdminReviews = () => {
  // -------------------- State & Store --------------------
  const token = useEcomStore((s) => s.token);
  const [allReviews, setAllReviews] = useState([]); // เก็บรีวิวทั้งหมดที่ดึงมา
  const [loading, setLoading] = useState(false);
  // สถานะตัวกรอง: 'all', 'replied', 'unreplied'
  const [filterStatus, setFilterStatus] = useState("all");
  const [ratingFilter, setRatingFilter] = useState(null);
  // สถานะการจัดเรียง: 'date_desc' (ล่าสุด), 'date_asc' (เก่าสุด), 'rating_desc' (ดาวมาก), 'rating_asc' (ดาวน้อย)
  const [sortBy, setSortBy] = useState("date_desc");
  // search, pagination and bulk select
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingReply, setEditingReply] = useState({});
  // UI helpers: confirm modal and toast
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    onConfirm: null,
  });
  const [toast, setToast] = useState(null);

  // debounced search value
  const debouncedSearch = useDebounce(searchText, 250);

  // -------------------- Fetch Data Logic --------------------
  const fetchReviews = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // เก็บข้อมูลทั้งหมดที่ดึงมาโดยไม่ต้องจัดเรียงในขั้นตอนนี้
      setAllReviews(res.data.reviews || []);
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถดึงรีวิวได้ - ตรวจสอบ Admin API Endpoint");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // -------------------- Filtering and Sorting Logic --------------------
  const filteredAndSortedReviews = useMemo(() => {
    let currentReviews = allReviews;
    // rating filter (1-5)
    if (ratingFilter) {
      currentReviews = currentReviews.filter(
        (r) => Number(r.rating) === Number(ratingFilter)
      );
    }
    // 1. Filtering
    if (filterStatus === "replied") {
      currentReviews = currentReviews.filter((r) => r.reply);
    } else if (filterStatus === "unreplied") {
      currentReviews = currentReviews.filter((r) => !r.reply);
    }

    // 1.5 Search (client-side)
    const q = (debouncedSearch || "").trim().toLowerCase();
    if (q) {
      currentReviews = currentReviews.filter((r) => {
        return (
          String(r.id).toLowerCase().includes(q) ||
          (r.user?.email || "").toLowerCase().includes(q) ||
          (r.product?.title || r.product?.name || "")
            .toLowerCase()
            .includes(q) ||
          (r.comment || "").toLowerCase().includes(q)
        );
      });
    }

    // 2. Sorting
    return currentReviews.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);

      switch (sortBy) {
        case "date_desc":
          return dateB - dateA; // ล่าสุด
        case "date_asc":
          return dateA - dateB; // เก่าสุด
        case "rating_desc":
          return (b.rating || 0) - (a.rating || 0); // ดาวมาก
        case "rating_asc":
          return (a.rating || 0) - (b.rating || 0); // ดาวน้อย
        default:
          return dateB - dateA;
      }
    });
  }, [allReviews, filterStatus, sortBy, debouncedSearch, ratingFilter]);

  // Pagination
  const totalReviews = filteredAndSortedReviews.length;
  const totalPages = Math.max(1, Math.ceil(totalReviews / pageSize));
  const pagedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedReviews.slice(start, start + pageSize);
  }, [filteredAndSortedReviews, currentPage, pageSize]);

  // -------------------- Review Actions (เหมือนเดิม) --------------------

  const handleDelete = async (id) => {
    // ... (logic เหมือนเดิม)
    if (!token) return alert("ต้องล็อกอิน");
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้อย่างถาวร?"))
      return;

    setActionLoading({ id, action: "delete" });
    try {
      await axios.delete(`${API}/review/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews(); // Re-fetch all data to update the list
    } catch (e) {
      console.error(e);
      alert("ลบรีวิวไม่สำเร็จ");
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!token) return alert("ต้องล็อกอิน");
    if (selectedIds.length === 0)
      return setToast({ type: "info", text: "ไม่มีรีวิวที่เลือก" });

    setConfirm({
      open: true,
      title: `ลบ ${selectedIds.length} รีวิว ที่เลือกหรือไม่?`,
      onConfirm: async () => {
        setConfirm((s) => ({ ...s, open: false }));
        setActionLoading({ id: selectedIds.join(","), action: "bulk_delete" });
        try {
          await axios.delete(`${API}/admin/reviews`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { ids: selectedIds },
          });
          setSelectedIds([]);
          fetchReviews();
          setToast({ type: "success", text: "ลบเรียบร้อย" });
        } catch (e) {
          console.error(e);
          setToast({ type: "error", text: "ลบไม่สำเร็จ" });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  // Export selected to CSV
  const handleExportCSV = () => {
    const rows = (
      selectedIds.length
        ? allReviews.filter((r) => selectedIds.includes(r.id))
        : filteredAndSortedReviews
    ).map((r) => ({
      id: r.id,
      user: r.user?.email || "",
      product: r.product?.title || r.product?.name || "",
      rating: r.rating || "",
      comment: (r.comment || "").replace(/\n/g, " "),
      reply: r.reply || "",
    }));

    if (rows.length === 0)
      return setToast({ type: "info", text: "ไม่มีข้อมูลสำหรับส่งออก" });

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviews_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: "success", text: "ดาวน์โหลดเริ่มต้นแล้ว" });
  };

  // -------------------- Reply Logic (เหมือนเดิม) --------------------

  const startEditReply = (id, existing = "") => {
    setEditingReply((s) => ({ ...s, [id]: existing }));
  };

  const cancelEditReply = (id) => {
    setEditingReply((s) => {
      const newState = { ...s };
      delete newState[id];
      return newState;
    });
  };

  const saveReply = async (id) => {
    // ... (logic เหมือนเดิม)
    if (!token) return alert("ต้องล็อกอิน");
    const text = (editingReply[id] || "").trim();
    if (!text) return alert("โปรดใส่ข้อความตอบกลับ");
    if (actionLoading) return;

    setActionLoading({ id, action: "reply" });
    try {
      const endpoint = `${API}/admin/reviews/${id}/reply`;
      const existing = allReviews.find((r) => String(r.id) === String(id));
      const method = existing && existing.reply ? "patch" : "post";

      await axios({
        method,
        url: endpoint,
        headers: { Authorization: `Bearer ${token}` },
        data: { reply: text },
      });

      cancelEditReply(id);
      fetchReviews(); // Re-fetch all data to update the list
    } catch (e) {
      console.error(e);
      alert("บันทึกการตอบกลับไม่สำเร็จ");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReply = async (id) => {
    // ... (logic เหมือนเดิม)
    if (!token) return alert("ต้องล็อกอิน");
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบการตอบกลับของผู้ดูแลระบบ?"))
      return;

    setActionLoading({ id, action: "delete_reply" });
    try {
      await axios.delete(`${API}/admin/reviews/${id}/reply`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews(); // Re-fetch all data to update the list
    } catch (e) {
      console.error(e);
      alert("ลบการตอบกลับไม่สำเร็จ");
    } finally {
      setActionLoading(null);
    }
  };

  // -------------------- Render --------------------
  const reviewCount = filteredAndSortedReviews.length;

  // Pre-render list items to avoid complex nested JSX in the return block
  const reviewsItems = pagedReviews.map((r) => {
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
        className={`p-6 border rounded-xl shadow-lg hover:shadow-xl transition duration-300 relative ${
          !r.reply
            ? "bg-yellow-50 border-yellow-200"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="absolute left-3 top-3">
          <input
            type="checkbox"
            checked={selectedIds.includes(r.id)}
            onChange={(e) => {
              setSelectedIds((s) => {
                if (e.target.checked) return Array.from(new Set([...s, r.id]));
                return s.filter((id) => id !== r.id);
              });
            }}
          />
        </div>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 mt-1">
            {r.user?.avatar ? (
              <img
                src={r.user.avatar}
                alt="User Avatar"
                className="w-16 h-16 rounded-full object-cover border-4 border-blue-100 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xl border-4 border-blue-100">
                <UserRound className="w-7 h-7" />
              </div>
            )}
          </div>
          <div className="flex-1">
            {/* Header: User, Product, Date, Rating */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
              <div className="flex flex-col">
                <span className="font-extrabold text-xl text-gray-900">
                  {r.user?.email || "ผู้ใช้งานนิรนาม"}
                </span>
                <span className="text-sm text-gray-500 font-medium mt-0.5">
                  รีวิวสินค้า:{" "}
                  <span className="text-blue-600 font-bold">
                    {r.product?.title || r.product?.name || "ไม่ระบุสินค้า"}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 md:mt-0">
                <RatingStars rating={r.rating} />
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {new Date(
                    r.createdAt || r.date || Date.now()
                  ).toLocaleDateString("th-TH", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Review Comment */}
            <div className="mt-2 p-4 bg-gray-50 border border-gray-100 rounded-lg text-gray-800 whitespace-pre-line text-base italic shadow-inner">
              {r.comment}
            </div>

            {/* Admin Reply Section */}
            {r.reply && !isEditing && (
              <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg shadow-sm">
                <div className="text-sm font-bold text-blue-700 mb-1 flex items-center gap-1">
                  <Edit3 className="w-4 h-4" />
                  การตอบกลับจากผู้ดูแลระบบ:
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {r.reply}
                </div>
                <div className="text-xs text-blue-500 mt-2 border-t border-blue-100 pt-1">
                  ตอบโดย: {r.replyBy?.email || "Admin"} เมื่อ{" "}
                  {r.repliedAt
                    ? new Date(r.repliedAt).toLocaleString("th-TH")
                    : ""}
                </div>
              </div>
            )}

            {/* Reply Editor / Action Buttons */}
            <div className="mt-4 flex flex-col gap-3">
              {isEditing ? (
                <div className="flex flex-col gap-2 p-4 bg-white border-2 border-blue-400 rounded-lg shadow-xl">
                  <textarea
                    value={editingReply[r.id]}
                    onChange={(e) =>
                      setEditingReply((s) => ({ ...s, [r.id]: e.target.value }))
                    }
                    className="border border-gray-300 rounded-md p-3 text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
                    rows={3}
                    placeholder="พิมพ์ข้อความตอบกลับเพื่อแสดงความเป็นมืออาชีพ..."
                    disabled={isReplying}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => cancelEditReply(r.id)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition flex items-center"
                      disabled={isReplying}
                    >
                      <X className="w-4 h-4 mr-1" /> ยกเลิก
                    </button>
                    <button
                      onClick={() => saveReply(r.id)}
                      className={`px-4 py-2 ${
                        r.reply
                          ? "bg-orange-600 hover:bg-orange-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white rounded-lg text-sm font-semibold transition flex items-center justify-center shadow-md`}
                      disabled={
                        isReplying ||
                        (editingReply[r.id] || "").trim() === (r.reply || "")
                      }
                    >
                      {isReplying ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      {r.reply ? "อัปเดตตอบกลับ" : "บันทึกตอบกลับ"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 border-t pt-3 mt-3 border-gray-100">
                  <button
                    onClick={() => startEditReply(r.id, r.reply || "")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center ${
                      r.reply
                        ? "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    }`}
                    disabled={isDeleting || isReplying}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    {r.reply ? "แก้ไขการตอบกลับ" : "ตอบกลับรีวิว"}
                  </button>

                  {r.reply && (
                    <button
                      onClick={() => deleteReply(r.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition flex items-center"
                      disabled={isDeleting || isReplying}
                    >
                      {actionLoading?.action === "delete_reply" ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      ลบการตอบกลับ
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center"
                    disabled={isDeleting || isReplying}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    ลบรีวิว
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  });

  // -------------------- Derived Stats --------------------
  const avgRating = useMemo(() => {
    if (!allReviews.length) return 0;
    const sum = allReviews.reduce((s, r) => s + (r.rating || 0), 0);
    return Math.round((sum / allReviews.length) * 10) / 10;
  }, [allReviews]);

  const ratingCounts = useMemo(() => {
    const c = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      const rr = r.rating || 0;
      if (rr >= 1 && rr <= 5) c[rr] = (c[rr] || 0) + 1;
    });
    return c;
  }, [allReviews]);

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-4xl mx-auto my-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <MessageSquareMore className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-extrabold text-gray-900">
            ศูนย์จัดการรีวิวลูกค้า
          </h2>
        </div>
        <div className="text-base font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full shadow-sm">
          {allReviews.length} รีวิวทั้งหมด
        </div>
      </div>

      {/* Control Panel: Stats, Filter and Sort */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-inner gap-4">
        <div className="flex-1 w-full mb-3 lg:mb-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm border flex flex-col">
              <span className="text-xs text-gray-500">คะแนนเฉลี่ย</span>
              <div className="text-2xl font-extrabold text-gray-900">
                {avgRating} <span className="text-sm text-gray-500">/5</span>
              </div>
              <div className="text-xs text-gray-500">
                จาก {formatNumber(allReviews.length)} รีวิว
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg shadow-sm border flex items-center gap-3">
              {Object.entries(ratingCounts).map(([k, v]) => (
                <div key={k} className="text-xs text-gray-600 px-2">
                  <div className="font-semibold">{k}★</div>
                  <div className="text-gray-400">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating chips filter */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setFilterStatus("all");
                setRatingFilter(null);
              }}
              className={`px-3 py-1 rounded-full text-sm ${
                !ratingFilter && filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border"
              }`}
            >
              ทั้งหมด
            </button>
            {[5, 4, 3, 2, 1].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setRatingFilter(n);
                  setFilterStatus("all");
                  setSearchText("");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-sm ${
                  ratingFilter === n
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white"
                } border`}
              >
                {n}★ ({ratingCounts[n] || 0})
              </button>
            ))}
            {ratingFilter && (
              <button
                onClick={() => setRatingFilter(null)}
                className="px-3 py-1 rounded-full text-sm bg-gray-100 border"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        <div className="w-full lg:w-auto flex items-center gap-3">
          <div className="flex items-center gap-3 w-full lg:w-80">
            <input
              type="search"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหารีวิว, อีเมล, ชื่อสินค้า หรือข้อความ..."
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={5}>5 / หน้า</option>
              <option value={10}>10 / หน้า</option>
              <option value={25}>25 / หน้า</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  selectedIds.length > 0 &&
                  selectedIds.length === allReviews.length
                }
                onChange={(e) => {
                  if (e.target.checked)
                    setSelectedIds(allReviews.map((r) => r.id));
                  else setSelectedIds([]);
                }}
                aria-label="Select all reviews"
              />
              <div className="text-sm text-gray-700">เลือกทั้งหมด</div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded-md text-sm font-medium focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">ทั้งหมด ({allReviews.length})</option>
                <option value="unreplied">
                  ยังไม่ได้ตอบ ({allReviews.filter((r) => !r.reply).length})
                </option>
                <option value="replied">
                  ตอบแล้ว ({allReviews.filter((r) => r.reply).length})
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 mr-2">
                จัดเรียง:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border border-gray-300 rounded-md text-sm font-medium focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="date_desc">วันที่ล่าสุด</option>
                <option value="date_asc">วันที่เก่าสุด</option>
                <option value="rating_desc">คะแนนสูงสุด (5 ดาว)</option>
                <option value="rating_asc">คะแนนต่ำสุด (1 ดาว)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Display Filtered Count */}
      <div
        className={`mb-4 text-sm font-medium p-2 rounded-lg ${
          reviewCount === allReviews.length
            ? "text-gray-600"
            : "text-blue-600 bg-blue-50 border border-blue-200"
        }`}
      >
        แสดง {reviewCount} รีวิว{" "}
        {reviewCount < allReviews.length &&
          `จากทั้งหมด ${allReviews.length} รีวิว`}
      </div>

      {/* Loading & Empty State */}
      {loading ? (
        <div className="py-20 text-center text-blue-500 flex flex-col items-center justify-center">
          <Loader2 className="w-14 h-14 animate-spin text-blue-400" />
          <p className="mt-4 text-lg font-medium">กำลังดึงข้อมูลรีวิว...</p>
          <p className="mt-2 text-sm text-gray-500">
            ลองรีเฟรชหน้าหากใช้เวลานาน
          </p>
        </div>
      ) : allReviews.length === 0 ? (
        <div className="py-20 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50">
          <MessageSquareMore className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-semibold">ยังไม่มีรีวิวเข้ามาในระบบ</p>
          <p className="text-sm mt-1">โปรดตรวจสอบว่า API และข้อมูลถูกต้อง</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Bulk toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                เลือก: {selectedIds.length} รายการ
              </div>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                disabled={selectedIds.length === 0}
              >
                ลบที่เลือก
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
              >
                ส่งออก CSV
              </button>
            </div>
            <div className="text-sm text-gray-500">
              หน้า {currentPage} / {totalPages}
            </div>
          </div>
          {/* Reviews List */}
          {reviewsItems}

          {/* Pagination footer */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              แสดงหน้า {currentPage} / {totalPages} — ทั้งหมด {totalReviews}{" "}
              รีวิว
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1 bg-white border rounded-md text-sm"
              >
                ก่อนหน้า
              </button>
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const v = Number(e.target.value) || 1;
                  setCurrentPage(Math.min(Math.max(1, v), totalPages));
                }}
                className="w-16 p-1 text-center border rounded-md"
              />
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-white border rounded-md text-sm"
              >
                ถัดไป
              </button>
            </div>
          </div>

          {reviewCount === 0 && allReviews.length > 0 && (
            <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <Filter className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-semibold">
                ไม่พบรีวิวที่ตรงกับตัวกรอง
              </p>
              <p className="text-sm mt-1">
                ลองเปลี่ยนการตั้งค่าตัวกรองหรือการจัดเรียง
              </p>
            </div>
          )}
        </div>
      )}
      {/* Confirm modal */}
      {confirm?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-lg font-bold mb-2">
              {confirm.title || "ยืนยัน"}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirm((s) => ({ ...s, open: false }))}
                className="px-4 py-2 bg-gray-100 rounded"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm && confirm.onConfirm();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                ดำเนินการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 px-4 py-2 rounded shadow-lg text-sm ${
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
};

export default AdminReviews;
