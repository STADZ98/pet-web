import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import axios from "axios";

const API =
  import.meta.env.VITE_API || "https://server-api-newgenz.vercel.app/api";

const AdminReviews = () => {
  const token = useEcomStore((s) => s.token);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // This endpoint doesn't exist to list all reviews by product globally,
      // so we'll call prisma via admin orders export or list popular reviews via /api/review? -- fallback: try /api/review (not supported)
      // We'll fetch recent reviews by querying admin orders then mapping to reviews is complex; instead use an existing lightweight endpoint if present.
      const res = await axios.get(`${API}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data.reviews || []);
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถดึงรีวิวได้ — endpoint อาจยังไม่ถูกต้อง");
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
    try {
      await axios.delete(`${API}/review/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch (e) {
      console.error(e);
      alert("Failed to delete review");
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
    try {
      const endpoint = `${API}/admin/reviews/${id}/reply`;
      // choose POST to create, PATCH to update based on presence in current state
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
      alert("Failed to save reply");
    }
  };

  const deleteReply = async (id) => {
    if (!token) return alert("ต้องล็อกอิน");
    if (!window.confirm("ลบการตอบกลับใช่หรือไม่?")) return;
    try {
      await axios.delete(`${API}/admin/reviews/${id}/reply`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch (e) {
      console.error(e);
      alert("Failed to delete reply");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">จัดการรีวิว</h2>
        <div className="text-sm text-gray-500">{reviews.length} รีวิว</div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No reviews found</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {r.user?.avatar ? (
                    <img
                      src={r.user.avatar}
                      alt="avatar"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      U
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {r.user?.email || "ผู้ใช้งาน"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {r.product?.title || r.product?.name || "สินค้า"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < (r.rating || 0)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.386 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.539 1.118L10 13.347l-3.452 2.607c-.783.57-1.838-.197-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.544 9.393c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.287-3.966z" />
                          </svg>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(
                          r.createdAt || r.date || Date.now()
                        ).toLocaleDateString("th-TH")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-gray-700 whitespace-pre-line">
                    {r.comment}
                  </div>

                  {r.reply && (
                    <div className="mt-3 bg-gray-50 border-l-4 border-blue-200 p-3 rounded">
                      <div className="text-sm text-gray-700 whitespace-pre-line">
                        {r.reply}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        ตอบโดย: {r.replyBy?.email || "ผู้ดูแลระบบ"} •{" "}
                        {r.repliedAt
                          ? new Date(r.repliedAt).toLocaleString("th-TH")
                          : ""}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                    >
                      ลบรีวิว
                    </button>

                    {editingReply[r.id] !== undefined ? (
                      <div className="flex gap-2 items-start w-full">
                        <textarea
                          value={editingReply[r.id]}
                          onChange={(e) =>
                            setEditingReply((s) => ({
                              ...s,
                              [r.id]: e.target.value,
                            }))
                          }
                          className="border rounded px-2 py-1 text-sm flex-1"
                          rows={3}
                        />
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => saveReply(r.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                          >
                            บันทึก
                          </button>
                          <button
                            onClick={() => cancelEditReply(r.id)}
                            className="px-3 py-1 bg-gray-100 rounded text-sm"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditReply(r.id, r.reply || "")}
                          className="px-3 py-1 bg-white border rounded text-sm"
                        >
                          {r.reply ? "แก้ไขการตอบกลับ" : "ตอบกลับ"}
                        </button>
                        {r.reply && (
                          <button
                            onClick={() => deleteReply(r.id)}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm"
                          >
                            ลบการตอบกลับ
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
