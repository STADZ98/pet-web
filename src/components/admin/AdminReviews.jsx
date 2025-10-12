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
      <h2 className="text-xl font-bold mb-4">จัดการรีวิว</h2>
      {loading ? (
        <div>Loading...</div>
      ) : reviews.length === 0 ? (
        <div>No reviews found</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {r.user?.avatar ? (
                  <img
                    src={r.user.avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100" />
                )}
                <div>
                  <div className="font-semibold">{r.user?.email}</div>
                  <div className="text-sm text-gray-600">
                    Rating: {r.rating}
                  </div>
                </div>
              </div>
              <div className="mt-2">{r.comment}</div>
              {r.reply && (
                <div className="mt-2 bg-gray-50 border-l-4 border-orange-300 p-3 rounded">
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
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleDelete(r.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
                {/* Reply controls */}
                {editingReply[r.id] !== undefined ? (
                  <div className="flex gap-2 items-start">
                    <textarea
                      value={editingReply[r.id]}
                      onChange={(e) =>
                        setEditingReply((s) => ({
                          ...s,
                          [r.id]: e.target.value,
                        }))
                      }
                      className="border rounded px-2 py-1 text-sm"
                      rows={3}
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => saveReply(r.id)}
                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm"
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
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
