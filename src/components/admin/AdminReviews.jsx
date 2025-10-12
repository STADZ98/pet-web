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
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleDelete(r.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
