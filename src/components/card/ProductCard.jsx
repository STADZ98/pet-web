// src/components/card/ProductCard.jsx
import React, { memo, useState, useEffect, useRef } from "react";
import { ShoppingCart, Heart, Eye, X } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useEcomStore from "../../store/ecom-store";
import { numberFormat } from "../../utils/number";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";

// Inline light SVG fallback (avoids network request and dark/black placeholder)
const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='180' viewBox='0 0 280 180'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, Helvetica, sans-serif' font-size='14'>No image</text></svg>`
)}
`;

// แปลง URL รูปให้เป็น HTTPS
const secureImageUrl = (url) => {
  if (!url) return FALLBACK_IMAGE;
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
};

// QuickView Modal
const QuickViewModal = ({ item, onClose, onAddToCart }) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const closeBtnRef = useRef(null);
  const triggerRef = useRef(null);
  const actionAddtoCart = useEcomStore((state) => state.actionAddtoCart);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    triggerRef.current = document.activeElement;
    window.addEventListener("keydown", onKey);
    setTimeout(() => closeBtnRef.current?.focus?.(), 60);

    return () => {
      window.removeEventListener("keydown", onKey);
      try {
        triggerRef.current?.focus?.();
      } catch {
        // ignore focus restore errors
      }
    };
  }, [onClose]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE;
  };

  const handleAddToCart = () => {
    actionAddtoCart({ ...item, qty });
    if (onAddToCart) onAddToCart();
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view: ${item.title || "สินค้า"}`}
      onClick={onClose}
    >
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      <Motion.div
        className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.995 }}
        transition={{
          duration: 0.22,
          type: "spring",
          stiffness: 260,
          damping: 24,
        }}
        role="document"
      >
        <div className="md:col-span-1 lg:col-span-2 relative bg-gray-50 flex flex-col items-center justify-center p-6 lg:p-12">
          <img
            src={secureImageUrl(
              item.images?.[imageIndex]?.url || item.images?.[0]?.url
            )}
            alt={item.title || "ไม่มีภาพสินค้า"}
            className="max-h-96 object-contain w-full rounded-lg shadow-lg"
            width={640}
            height={384}
            onError={handleImageError}
          />

          {item.images && item.images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setImageIndex(
                    (i) => (i - 1 + item.images.length) % item.images.length
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white p-3 rounded-full shadow-md transition"
                aria-label="ก่อนหน้า"
              >
                <span className="text-2xl font-bold text-gray-700">‹</span>
              </button>
              <button
                onClick={() =>
                  setImageIndex((i) => (i + 1) % item.images.length)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white p-3 rounded-full shadow-md transition"
                aria-label="ถัดไป"
              >
                <span className="text-2xl font-bold text-gray-700">›</span>
              </button>
            </>
          )}
        </div>

        <div className="p-6 md:p-8 flex flex-col justify-between col-span-1">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-2 rounded-full bg-white transition"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-gray-500 uppercase">
                {item.brand?.name || "แบรนด์"}
              </span>
              <h4 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {item.title}
              </h4>
            </div>

            <div className="flex items-end gap-4 mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-gray-600">฿</span>
                <span className="text-4xl font-extrabold text-rose-600">
                  {numberFormat(item.price || 0)}
                </span>
              </div>
              {item.originalPrice && item.discountPercentage && (
                <div className="text-base text-gray-400 line-through">
                  ฿{numberFormat(item.originalPrice)}
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-4 leading-relaxed line-clamp-4">
              {item.description ||
                item.shortDescription ||
                "ไม่มีคำอธิบายเพิ่มเติม"}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  aria-label="ลดจำนวน"
                >
                  <span className="font-bold">-</span>
                </button>
                <div className="px-5 py-3 bg-white text-center font-semibold text-gray-800">
                  {qty}
                </div>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  aria-label="เพิ่มจำนวน"
                >
                  <span className="font-bold">+</span>
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                <ShoppingCart className="inline-block w-5 h-5 mr-2" />
                <span>เพิ่มลงในตะกร้า</span>
              </button>
            </div>
          </div>
        </div>
      </Motion.div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

// ProductCard
const ProductCard = ({ item, onAddToCart }) => {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (e.target.closest("button")) return;
    navigate(`/product/${item.id}`);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE;
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        // use a lightweight CSS hover transform instead of animating on mount
        style={{ willChange: "transform, opacity" }}
        className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl cursor-pointer flex flex-col w-full max-w-sm md:w-64 overflow-hidden relative transform-gpu transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-1"
        title={item.title || "สินค้า"}
      >
        <div className="relative w-full h-48 bg-gray-50 flex items-center justify-center p-5">
          {item.isNew && (
            <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm z-10">
              ใหม่
            </span>
          )}
          {item.discountPercentage && (
            <span className="absolute top-3 left-14 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm z-10">
              -{item.discountPercentage}%
            </span>
          )}

          <div className="relative w-full h-full rounded-lg overflow-hidden bg-white">
            <img
              src={secureImageUrl(item.images?.[0]?.url)}
              alt={item.title || "ไม่มีภาพสินค้า"}
              className="w-full h-full object-contain transition-transform duration-400 ease-in-out hover:scale-105"
              width={320}
              height={192}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
          </div>
        </div>

        <div className="flex flex-col flex-1 px-4 py-4 gap-3">
          <h3
            className="text-md md:text-lg font-semibold text-gray-900 leading-tight line-clamp-2"
            title={item.title}
          >
            {item.title || "-"}
          </h3>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm text-orange-600">฿</span>
            <span className="text-xl md:text-2xl font-extrabold text-orange-600">
              {numberFormat(item.price || 0)}
            </span>
            {item.originalPrice && item.discountPercentage && (
              <div className="text-sm text-gray-400 line-through">
                ฿{numberFormat(item.originalPrice)}
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewOpen(true);
            }}
            className="w-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus:opacity-100 focus:translate-y-0 transition-all duration-200 transform-gpu bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg flex items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-orange-300"
          >
            <Eye className="w-4 h-4 text-white" />
            <span className="text-sm">ดูด่วน</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {quickViewOpen && (
          <QuickViewModal
            item={item}
            onClose={() => setQuickViewOpen(false)}
            onAddToCart={onAddToCart}
          />
        )}
      </AnimatePresence>
    </>
  );
};

ProductCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number,
    originalPrice: PropTypes.number,
    discountPercentage: PropTypes.number,
    isNew: PropTypes.bool,
    images: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })),
    description: PropTypes.string,
    shortDescription: PropTypes.string,
    brand: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ name: PropTypes.string }),
    ]),
  }).isRequired,
  onAddToCart: PropTypes.func,
};

export default memo(ProductCard);
