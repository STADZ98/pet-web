import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import axios from "axios";
import {
  Star,
  MessageSquareMore,
  Trash2,
  Edit3,
  Check,
  X,
  Send,
  Loader2,
  UserRound,
} from "lucide-react"; // Import Icons

const API =
  import.meta.env.VITE_API || "https://server-api-newgenz.vercel.app/api";

// --- Component: RatingStars (แยกออกมาเพื่อให้โค้ดดูสะอาดขึ้น) ---
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

// --- Component: AdminReviews ---
const AdminReviews = () => {
  const token = useEcomStore((s) => s.token);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  // สถานะสำหรับปุ่ม: ลบ/บันทึก เพื่อป้องกันการกดซ้ำซ้อน
  const [actionLoading, setActionLoading] = useState(null); // { id, action: 'delete' | 'reply' }

  const fetchReviews = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // NOTE: Assuming this endpoint /admin/reviews returns the list of all reviews with user and product details
      const res = await axios.get(`${API}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // เพิ่มการจัดเรียงตามวันที่ล่าสุด (หรือตาม rating ถ้าต้องการ)
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
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = async (id) => {
    if (!token) return alert("ต้องล็อกอิน");
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้อย่างถาวร?"))
      return;

    setActionLoading({ id, action: "delete" });
    try {
      await axios.delete(`${API}/review/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch (e) {
      console.error(e);
      alert("ลบรีวิวไม่สำเร็จ");
    } finally {
      setActionLoading(null);
    }
  };

  // Admin reply actions
  const [editingReply, setEditingReply] = useState({}); // { [id]: text }

  const startEditReply = (id, existing = "") => {
    setEditingReply((s) => ({ ...s, [id]: existing }));
  };

  const cancelEditReply = (id) => {
    setEditingReply((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
  };

  const saveReply = async (id) => {
    if (!token) return alert("ต้องล็อกอิน");
    const text = (editingReply[id] || "").trim();
    if (!text) return alert("โปรดใส่ข้อความตอบกลับ");
    if (actionLoading) return;

    setActionLoading({ id, action: "reply" });
    try {
      const endpoint = `${API}/admin/reviews/${id}/reply`;
      const existing = reviews.find((r) => String(r.id) === String(id));
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

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6 border-b pb-3">
        <div className="flex items-center gap-2">
          <MessageSquareMore className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-extrabold text-gray-900">
            จัดการรีวิวลูกค้า
          </h2>
        </div>
        <div className="text-base font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {reviews.length} รีวิวทั้งหมด
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-blue-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="mt-3 font-medium">กำลังดึงข้อมูลรีวิว...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center text-gray-500 border border-dashed rounded-lg bg-gray-50">
          <MessageSquareMore className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">ยังไม่มีรีวิวเข้ามาในระบบ</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => {
            const isDeleting =
              actionLoading?.id === r.id && actionLoading?.action === "delete";
            const isReplying =
              actionLoading?.id === r.id &&
              (actionLoading?.action === "reply" ||
                actionLoading?.action === "delete_reply");

            return (
              <div
                key={r.id}
                className="p-5 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-md transition duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    {r.user?.avatar ? (
                      <img
                        src={r.user.avatar}
                        alt="avatar"
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-xl">
                        <UserRound className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    {/* Header: User, Product, Date, Rating */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-gray-800">
                          {r.user?.email || "ผู้ใช้งานนิรนาม"}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          รีวิวสินค้า:{" "}
                          <span className="text-blue-600 font-semibold">
                            {r.product?.title ||
                              r.product?.name ||
                              "ไม่ระบุสินค้า"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 md:mt-0">
                        <RatingStars rating={r.rating} />
                        <div className="text-xs text-gray-500">
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
                    <div className="mt-3 p-3 bg-white border border-gray-100 rounded-lg shadow-inner text-gray-700 whitespace-pre-line text-base">
                      {r.comment}
                    </div>

                    {/* Admin Reply Section */}
                    {r.reply && editingReply[r.id] === undefined && (
                      <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-semibold text-blue-700 mb-1">
                            การตอบกลับจากผู้ดูแลระบบ:
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {r.reply}
                        </div>
                        <div className="text-xs text-blue-400 mt-2">
                          ตอบโดย: {r.replyBy?.email || "Admin"} •{" "}
                          {r.repliedAt
                            ? new Date(r.repliedAt).toLocaleString("th-TH")
                            : ""}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons / Reply Editor */}
                    <div className="mt-4 flex flex-col gap-3">
                      {editingReply[r.id] !== undefined ? (
                        /* Reply Editor */
                        <div className="flex flex-col gap-2 p-3 bg-white border border-blue-200 rounded-lg shadow-inner">
                          <textarea
                            value={editingReply[r.id]}
                            onChange={(e) =>
                              setEditingReply((s) => ({
                                ...s,
                                [r.id]: e.target.value,
                              }))
                            }
                            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
                            rows={3}
                            placeholder="พิมพ์ข้อความตอบกลับเพื่อแสดงความเป็นมืออาชีพ..."
                            disabled={isReplying}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => cancelEditReply(r.id)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                              disabled={isReplying}
                            >
                              <X className="w-4 h-4 mr-1 inline-block" />
                              ยกเลิก
                            </button>
                            <button
                              onClick={() => saveReply(r.id)}
                              className={`px-4 py-2 ${
                                r.reply
                                  ? "bg-orange-500 hover:bg-orange-600"
                                  : "bg-blue-600 hover:bg-blue-700"
                              } text-white rounded-lg text-sm font-medium transition flex items-center justify-center`}
                              disabled={isReplying}
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
                        <div className="flex items-center justify-end gap-2">
                          {/* Reply/Edit Reply Button */}
                          <button
                            onClick={() => startEditReply(r.id, r.reply || "")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center ${
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
                              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition flex items-center"
                              disabled={isDeleting || isReplying}
                            >
                              {isReplying ? (
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
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center"
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
