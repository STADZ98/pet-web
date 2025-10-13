import React, { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";

// -------------------- Constants --------------------
const API =
  import.meta.env.VITE_API || "https://server-api-newgenz.vercel.app/api";

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
const AdminReviews = () => {
  // -------------------- State & Store --------------------
  const token = useEcomStore((s) => s.token);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  // สถานะสำหรับปุ่ม: ลบ/บันทึก เพื่อป้องกันการกดซ้ำซ้อน { id, action: 'delete' | 'reply' | 'delete_reply' }
  const [actionLoading, setActionLoading] = useState(null);
  // สถานะสำหรับ Reply Editor
  const [editingReply, setEditingReply] = useState({}); // { [id]: text }

  // -------------------- Fetch Data Logic --------------------
  const fetchReviews = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // NOTE: Assuming this endpoint /admin/reviews returns the list of all reviews with user and product details
      const res = await axios.get(`${API}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // เพิ่มการจัดเรียงตามวันที่ล่าสุด
      const sortedReviews = (res.data.reviews || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setReviews(sortedReviews);
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถดึงรีวิวได้ - ตรวจสอบ Admin API Endpoint");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]); // Depend on useCallback's stable reference

  // -------------------- Review Actions --------------------

  const handleDelete = async (id) => {
    if (!token) return alert("ต้องล็อกอิน");
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้อย่างถาวร?"))
      return;

    setActionLoading({ id, action: "delete" });
    try {
      await axios.delete(`${API}/review/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // อัปเดตรายการรีวิว
      fetchReviews();
    } catch (e) {
      console.error(e);
      alert("ลบรีวิวไม่สำเร็จ");
    } finally {
      setActionLoading(null);
    }
  };

  // -------------------- Reply Logic --------------------

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
    if (!token) return alert("ต้องล็อกอิน");
    const text = (editingReply[id] || "").trim();
    if (!text) return alert("โปรดใส่ข้อความตอบกลับ");
    if (actionLoading) return; // Prevent double click

    setActionLoading({ id, action: "reply" });
    try {
      const endpoint = `${API}/admin/reviews/${id}/reply`;
      const existing = reviews.find((r) => String(r.id) === String(id));
      // ใช้ PATCH หากมี reply แล้ว, ใช้ POST หากยังไม่มี
      const method = existing && existing.reply ? "patch" : "post";

      await axios({
        method,
        url: endpoint,
        headers: { Authorization: `Bearer ${token}` },
        data: { reply: text },
      });

      cancelEditReply(id);
      fetchReviews();
    } catch (e) {
      console.error(e);
      alert("บันทึกการตอบกลับไม่สำเร็จ");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReply = async (id) => {
    if (!token) return alert("ต้องล็อกอิน");
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบการตอบกลับของผู้ดูแลระบบ?"))
      return;

    setActionLoading({ id, action: "delete_reply" });
    try {
      await axios.delete(`${API}/admin/reviews/${id}/reply`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch (e) {
      console.error(e);
      alert("ลบการตอบกลับไม่สำเร็จ");
    } finally {
      setActionLoading(null);
    }
  };

  // -------------------- Render --------------------
  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl border border-gray-100 max-w-4xl mx-auto my-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <MessageSquareMore className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-extrabold text-gray-900">
            ศูนย์จัดการรีวิวลูกค้า
          </h2>
        </div>
        <div className="text-base font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full shadow-sm">
          {reviews.length} รีวิวทั้งหมด
        </div>
      </div>

      {/* Loading & Empty State */}
      {loading ? (
        <div className="py-20 text-center text-blue-500 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="mt-4 text-lg font-medium">กำลังดึงข้อมูลรีวิว...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-20 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <MessageSquareMore className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-semibold">ยังไม่มีรีวิวเข้ามาในระบบ</p>
          <p className="text-sm mt-1">เมื่อมีลูกค้าส่งรีวิว จะแสดงขึ้นที่นี่</p>
        </div>
      ) : (
        /* Reviews List */
        <div className="space-y-8">
          {reviews.map((r) => {
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
                className="p-6 border border-gray-200 rounded-xl bg-white shadow-lg hover:shadow-xl transition duration-300 relative"
              >
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
                            {r.product?.title ||
                              r.product?.name ||
                              "ไม่ระบุสินค้า"}
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
                        /* Reply Editor */
                        <div className="flex flex-col gap-2 p-4 bg-white border-2 border-blue-400 rounded-lg shadow-xl">
                          <textarea
                            value={editingReply[r.id]}
                            onChange={(e) =>
                              setEditingReply((s) => ({
                                ...s,
                                [r.id]: e.target.value,
                              }))
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
                              <X className="w-4 h-4 mr-1" />
                              ยกเลิก
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
                                (editingReply[r.id] || "").trim() ===
                                  (r.reply || "")
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
                        /* Action Buttons */
                        <div className="flex items-center justify-end gap-2 border-t pt-3 mt-3 border-gray-100">
                          {/* Reply/Edit Reply Button */}
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

                          {/* Delete Reply Button */}
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

                          {/* Delete Review Button */}
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
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
