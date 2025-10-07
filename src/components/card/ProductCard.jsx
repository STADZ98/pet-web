import React, { memo, useState, useEffect, useRef } from "react";
import { ShoppingCart, Eye, X } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useEcomStore from "../../store/ecom-store";
import { numberFormat } from "../../utils/number";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";

const FALLBACK_IMAGE = "https://server-api-newgenz.vercel.app/no-image.png";

// ✅ QuickView Modal
const QuickViewModal = ({ item, onClose, onAddToCart }) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const closeBtnRef = useRef(null);
  const triggerRef = useRef(null);
  const actionAddtoCart = useEcomStore((state) => state.actionAddtoCart);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    triggerRef.current = document.activeElement;
    window.addEventListener("keydown", handleKey);
    setTimeout(() => closeBtnRef.current?.focus?.(), 60);
    return () => {
      window.removeEventListener("keydown", handleKey);
      triggerRef.current?.focus?.();
    };
  }, [onClose]);

  const getSecureUrl = (url) =>
    url?.replace(/^http:\/\//, "https://") || FALLBACK_IMAGE;

  const handleAddToCart = () => {
    actionAddtoCart({ ...item, qty });
    onAddToCart?.();
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <Motion.div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-hidden"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.25 }}
      >
        {/* ภาพสินค้า */}
        <div className="md:col-span-1 lg:col-span-2 relative flex flex-col items-center justify-center bg-gray-50 p-6 lg:p-12">
          <img
            src={getSecureUrl(
              item.images?.[imageIndex]?.url || item.images?.[0]?.url
            )}
            alt={item.title || "ไม่มีภาพสินค้า"}
            className="max-h-96 w-full object-contain rounded-lg shadow-lg"
            onError={(e) => (e.target.src = FALLBACK_IMAGE)}
            loading="lazy"
            decoding="async"
          />
          {item.images?.length > 1 && (
            <>
              <button
                onClick={() =>
                  setImageIndex(
                    (i) => (i - 1 + item.images.length) % item.images.length
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-3 rounded-full shadow"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setImageIndex((i) => (i + 1) % item.images.length)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-3 rounded-full shadow"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* รายละเอียด */}
        <div className="p-6 md:p-8 flex flex-col justify-between">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-2 rounded-full bg-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-4">
            <span className="text-sm font-semibold text-gray-500 uppercase">
              {item.brand?.name || "แบรนด์"}
            </span>
            <h4 className="text-2xl font-extrabold text-gray-900">
              {item.title}
            </h4>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-rose-600">
                ฿{numberFormat(item.price || 0)}
              </span>
              {item.originalPrice && item.discountPercentage && (
                <span className="text-sm text-gray-400 line-through">
                  ฿{numberFormat(item.originalPrice)}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 line-clamp-4">
              {item.description ||
                item.shortDescription ||
                "ไม่มีคำอธิบายเพิ่มเติม"}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {/* ปุ่มจำนวนสินค้า */}
              <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200"
                >
                  -
                </button>
                <div className="px-5 py-3 bg-white font-semibold">{qty}</div>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200"
                >
                  +
                </button>
              </div>

              {/* ปุ่มเพิ่มในตะกร้า */}
              <button
                onClick={handleAddToCart}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-md"
              >
                <ShoppingCart className="inline w-5 h-5 mr-2" />
                เพิ่มลงในตะกร้า
              </button>
            </div>
          </div>
        </div>
      </Motion.div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
};

// ✅ ProductCard
const ProductCard = ({ item, onAddToCart }) => {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (e.target.closest("button")) return;
    navigate(`/product/${item.id}`);
  };

  const getSecureUrl = (url) =>
    url?.replace(/^http:\/\//, "https://") || FALLBACK_IMAGE;

  return (
    <>
      <Motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.25 }}
        onClick={handleCardClick}
        className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl cursor-pointer flex flex-col w-full max-w-sm overflow-hidden"
      >
        {/* รูปสินค้า */}
        <div className="relative w-full h-48 bg-gray-50 flex items-center justify-center p-5">
          {item.isNew && (
            <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
              ใหม่
            </span>
          )}
          {item.discountPercentage && (
            <span className="absolute top-3 left-14 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
              -{item.discountPercentage}%
            </span>
          )}
          <img
            src={getSecureUrl(item.images?.[0]?.url)}
            alt={item.title || "ไม่มีภาพสินค้า"}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            onError={(e) => (e.target.src = FALLBACK_IMAGE)}
          />
        </div>

        {/* ข้อมูลสินค้า */}
        <div className="flex flex-col flex-1 px-4 py-4 gap-3">
          <h3 className="text-md md:text-lg font-semibold text-gray-900 line-clamp-2">
            {item.title || "-"}
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-orange-600">
              ฿{numberFormat(item.price || 0)}
            </span>
            {item.originalPrice && item.discountPercentage && (
              <span className="text-sm text-gray-400 line-through">
                ฿{numberFormat(item.originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewOpen(true);
            }}
            className="w-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 px-4 rounded-full shadow-md transition-all"
          >
            <Eye className="inline w-4 h-4 mr-2" />
            ดูด่วน
          </button>
        </div>
      </Motion.div>

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
