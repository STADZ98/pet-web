import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Mail,
  Hash,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API } from "../../api/admin";

const RequestDetailModal = ({ open, onClose, request }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [evidenceImgs, setEvidenceImgs] = useState([]);

  useEffect(() => {
    if (request?.images) {
      const imgs = request.images
        .map((img) => ({
          src: buildEvidenceUrl(img),
        }))
        .filter((img) => img.src);
      setEvidenceImgs(imgs);
      setCurrentImgIndex(0);
    }
  }, [request]);

  // ✅ ฟังก์ชันสร้าง URL ของหลักฐาน
  const buildEvidenceUrl = (img) => {
    if (!img) return null;

    const base = (API || "").replace(/\/+$/, "");

    if (typeof img === "string") {
      const s = img.trim();

      // ✅ Base64 / blob
      if (/^data:|^blob:/i.test(s)) return s;

      // ✅ Full URL
      if (/^https?:\/\//i.test(s)) return s;

      // ✅ Path ที่ขึ้นต้นด้วย /
      if (s.startsWith("/")) return `${base}${s}`;

      // ✅ ชื่อไฟล์ เช่น return-abc.jpg
      return `${base}/user/return-image/${s}`;
    }

    // ✅ Object type
    if (img?.url || img?.src) return buildEvidenceUrl(img.url || img.src);
    if (img?.id) return `${base}/user/return-image/${img.id}`;

    return null;
  };

  const handleNextImg = () => {
    setCurrentImgIndex((prev) =>
      prev === evidenceImgs.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImg = () => {
    setCurrentImgIndex((prev) =>
      prev === 0 ? evidenceImgs.length - 1 : prev - 1
    );
  };

  if (!open || !request) return null;

  const productImg =
    request.productImage ||
    request.variantImage ||
    request.product?.images?.[0]?.url ||
    request.product?.image ||
    "";

  const productName =
    request.variantName || request.productName || request.product?.name || "-";

  const reason =
    request.reason === "อื่น ๆ (โปรดระบุ)"
      ? request.customReason || "ไม่ระบุ"
      : request.reason;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            รายละเอียดการขอคืนสินค้า
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* หมายเลขคำสั่งซื้อและอีเมล */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-gray-500" />
              <span>Order ID:</span>
              <span className="font-semibold">{request.orderId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{request.userEmail || "ไม่พบอีเมล"}</span>
            </div>
          </div>

          {/* รูปสินค้า */}
          <div className="flex gap-5 items-center">
            <div className="w-32 h-32 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center">
              {productImg ? (
                <img
                  src={buildEvidenceUrl(productImg)}
                  alt={productName}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-400 text-sm">ไม่มีรูปสินค้า</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{productName}</p>
              <p className="text-gray-500 text-sm">
                จำนวน: {request.quantity || 1} ชิ้น
              </p>
              <p className="text-gray-500 text-sm">
                ราคา: ฿{request.price?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          {/* เหตุผล */}
          <div>
            <p className="font-semibold text-gray-800 mb-1">เหตุผลในการคืน:</p>
            <p className="text-gray-600">{reason}</p>
          </div>

          {/* รูปหลักฐาน */}
          <div>
            <p className="font-semibold text-gray-800 mb-2">
              รูปหลักฐานการคืนสินค้า:
            </p>

            {evidenceImgs.length > 0 ? (
              <div className="relative flex flex-col items-center">
                <div className="w-full max-w-md h-64 border rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={evidenceImgs[currentImgIndex].src}
                    alt={`หลักฐาน ${currentImgIndex + 1}`}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />
                </div>
                {evidenceImgs.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImg}
                      className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow hover:bg-gray-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImg}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow hover:bg-gray-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {currentImgIndex + 1} / {evidenceImgs.length}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">ไม่มีรูปหลักฐาน</p>
            )}
          </div>

          {/* Debug URLs */}
          {evidenceImgs.length > 0 && (
            <details className="mt-4 text-xs text-gray-600">
              <summary className="cursor-pointer">🔍 Debug URLs</summary>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {evidenceImgs.map((img, i) => (
                  <div key={i}>
                    <p className="break-all">{img.src}</p>
                    <img
                      src={img.src}
                      alt=""
                      className="w-full h-24 object-cover border"
                    />
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-5 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
