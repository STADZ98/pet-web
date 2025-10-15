import { useState, useEffect, useCallback, useMemo } from "react";
import { getOrders, cancelOrder as apiCancelOrder } from "../../api/user";
import useEcomStore from "../../store/ecom-store";
import { numberFormat } from "../../utils/number";
import {
  X,
  Star,
  PackageSearch,
  UserRound,
  ShoppingCart,
  BadgeCheck,
  Truck,
  Ban,
  Pencil,
  Trash,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Phone, // added missing icon
} from "lucide-react";
import { toast } from "react-toastify";
import OrderDetailsModal from "./HistoryCardOrderDetailsModal";
import ReviewModal from "./HistoryCard.ReviewModal";
import ReturnProductModal from "./HistoryCard.ReturnProductModal";
import CancelOrderModal from "./HistoryCard.CancelOrderModal";

// Shared constants to make labels and steps easier to maintain
// ----------------------------------------------------------------------
// Main HistoryCard component
// ----------------------------------------------------------------------
const HistoryCard = () => {
  // สรุปสถานะสินค้า
  const [statusSummary, setStatusSummary] = useState({
    NOT_PROCESSED: 0,
    PROCESSING: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  });
  // State for CancelOrderModal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [cancelOrderDetail, setCancelOrderDetail] = useState(null);

  // Handler for submitting cancel
  const handleCancelSubmit = async () => {
    if (!cancelOrderDetail) {
      toast.error("ไม่พบคำสั่งซื้อที่ต้องการยกเลิก");
      return;
    }
    setCancelLoading(true);
    try {
      const orderId =
        cancelOrderDetail.orderId ||
        cancelOrderDetail._id ||
        cancelOrderDetail.id;
      if (!orderId) throw new Error("ไม่พบรหัสคำสั่งซื้อ");

      // Use axios helper which includes base URL and headers
      const res = await apiCancelOrder(token, orderId);

      // axios will throw on non-2xx, but handle defensively
      if (res && (res.status === 200 || res.status === 204 || res.data?.ok)) {
        toast.success("ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว!");
        hdlGetOrders(token);
        setIsCancelModalOpen(false);
        setCancelOrderDetail(null);
        setCancelReason("");
        setCustomCancelReason("");
      } else {
        const msg =
          res?.data?.message ||
          res?.statusText ||
          "ไม่สามารถยกเลิกคำสั่งซื้อได้";
        throw new Error(msg);
      }
    } catch (err) {
      console.debug(err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ";
      toast.error(message);
    }
    setCancelLoading(false);
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setCancelOrderDetail(null);
    setCancelReason("");
    setCustomCancelReason("");
    setCancelLoading(false);
  };
  const token =
    useEcomStore((state) => state.token) || localStorage.getItem("token");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [reviewOrderUpdatedAt, setReviewOrderUpdatedAt] = useState(null);
  // --- Return Product Modal State ---
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [selectedReturnProducts, setSelectedReturnProducts] = useState([]);
  const [returnReason, setReturnReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [returnImages, setReturnImages] = useState([]);
  const [returnLoading, setReturnLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [activeStatus, setActiveStatus] = useState(null);
  // Sort order: 'newest' or 'oldest'. Persist to localStorage so user's choice remains.
  const [sortOrder, setSortOrder] = useState(() => {
    try {
      return localStorage.getItem("ordersSortOrder") || "newest";
    } catch (e) {
      console.debug(e);
      return "newest";
    }
  });
  // Review reminders state
  const [reviewReminders, setReviewReminders] = useState([]);
  const [dismissedReminders, setDismissedReminders] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("dismissedReviewReminders") || "[]"
      );
    } catch (e) {
      console.debug(e);
      return [];
    }
  });

  // Track products the user already reviewed (persist to localStorage)
  // Format: { [productId]: lastReviewedAtEpochMillis }
  const [reviewedProducts, setReviewedProducts] = useState(() => {
    try {
      const raw = JSON.parse(
        localStorage.getItem("reviewedProducts") || "null"
      );
      // Backwards compatibility: if array of ids, convert to map with now timestamp
      if (Array.isArray(raw)) {
        const now = Date.now();
        const map = {};
        raw.forEach((id) => (map[String(id)] = now));
        return map;
      }
      if (raw && typeof raw === "object") {
        // ensure values are numbers
        const map = {};
        Object.entries(raw).forEach(([k, v]) => {
          map[String(k)] = Number(v) || 0;
        });
        return map;
      }
      return {};
    } catch (e) {
      console.debug(e);
      return {};
    }
  });

  // Helper to build a stable key for product or variant: "<productId>" or "<productId>:<variantId>"
  const makeReviewedKey = (productId, variantId) => {
    if (!productId) return null;
    return variantId
      ? `${String(productId)}:${String(variantId)}`
      : String(productId);
  };

  // helper to recompute reminders from current orders/dismissed/reviewed state
  const recomputeReviewReminders = useCallback(() => {
    if (!orders || orders.length === 0) {
      setReviewReminders([]);
      return [];
    }
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const rem = orders.filter((o) => {
      if (o.orderStatus !== "DELIVERED") return false;
      const updated = new Date(o.updatedAt).getTime();
      if (isNaN(updated)) return false;
      const id = o._id || o.id || o.orderId;
      if (dismissedReminders.includes(id)) return false;
      // if all products in this order have been reviewed by user, skip
      const hasUnreviewed = (o.products || []).some((p) => {
        const pid = String(p.product?._id || p.product?.id || "");
        const vid = String(
          p.variant?.id || p.variant?._id || p.variant?.variantId || ""
        );
        if (!pid) return true; // treat unknown as unreviewed
        const variantKey = vid ? `${pid}:${vid}` : null;
        const lastReviewedVariant = variantKey
          ? Number(reviewedProducts[variantKey]) || 0
          : 0;
        const lastReviewedProduct = Number(reviewedProducts[pid]) || 0;
        const lastReviewed = Math.max(lastReviewedVariant, lastReviewedProduct);
        const orderUpdated = new Date(o.updatedAt).getTime() || 0;
        // If lastReviewed is after or equal to orderUpdated, consider reviewed for this order
        return lastReviewed < orderUpdated;
      });
      if (!hasUnreviewed) return false;
      return now - updated <= twoWeeks;
    });
    setReviewReminders(rem);
    return rem;
  }, [orders, dismissedReminders, reviewedProducts]);

  // Bulk-review flow state (declare before any effect that references it)
  const [bulkReviewMode, setBulkReviewMode] = useState(false);
  const [bulkQueueProducts, setBulkQueueProducts] = useState([]);

  const startBulkReview = () => {
    // lazy-evaluate pendingReviewItems at click-time (defined later in file)
    try {
      if (!pendingReviewItems || pendingReviewItems.length === 0) return;
      const products = pendingReviewItems.map((i) => i.product).filter(Boolean);
      if (products.length === 0) return;
      setBulkQueueProducts(products);
      setBulkReviewMode(true);
      // open first product's review modal with its order context if available
      const first = pendingReviewItems[0];
      if (first && first.product)
        openReviewModal(first.product, first.product.variant, first.order);
      else openReviewModal(products[0]);
    } catch (err) {
      console.debug(err);
    }
  };

  // Close modals and reset states when navigating away or on token change
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Prompt message for unsaved changes (e.g., in review modal)
      const confirmationMessage =
        "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึกในฟอร์มรีวิว ต้องการออกจากหน้านี้หรือไม่?";
      e.preventDefault();
      e.returnValue = confirmationMessage; // Legacy method for cross-browser support
      return confirmationMessage; // Modern browsers
    };

    if (isReviewOpen || bulkReviewMode) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Do not call setState during cleanup; leave bulk state as-is.
    };
  }, [isReviewOpen, bulkReviewMode]);

  useEffect(() => {
    hdlGetOrders(token);
  }, [token]);

  const hdlGetOrders = (token) => {
    if (!token) {
      setOrders([]);
      return;
    }
    setIsLoading(true);
    getOrders(token)
      .then((res) => {
        // Ensure orders are sorted newest first by updatedAt (or createdAt fallback)
        const sortedOrders = (res.data.orders || []).slice().sort((a, b) => {
          const ta = new Date(a.updatedAt || a.createdAt).getTime() || 0;
          const tb = new Date(b.updatedAt || b.createdAt).getTime() || 0;
          return tb - ta; // newest first
        });
        setOrders(sortedOrders);
        // สรุปสถานะ (รองรับทั้ง 'Cancelled' และ 'CANCELLED')
        const summary = {
          NOT_PROCESSED: 0,
          PROCESSING: 0,
          DELIVERED: 0,
          CANCELLED: 0,
        };
        sortedOrders.forEach((order) => {
          if (
            order.orderStatus === "CANCELLED" ||
            order.orderStatus === "Cancelled"
          ) {
            summary.CANCELLED++;
          } else if (summary[order.orderStatus] !== undefined) {
            summary[order.orderStatus]++;
          }
        });
        setStatusSummary(summary);
      })
      .catch((err) => {
        if (err?.response?.data?.message === "No orders") {
          setOrders([]);
          setStatusSummary({
            NOT_PROCESSED: 0,
            PROCESSING: 0,
            DELIVERED: 0,
            CANCELLED: 0,
          });
        } else {
          console.error(err);
          setOrders([]);
          setStatusSummary({
            NOT_PROCESSED: 0,
            PROCESSING: 0,
            DELIVERED: 0,
            CANCELLED: 0,
          });
        }
      })
      .finally(() => setIsLoading(false));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "NOT_PROCESSED":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case "NOT_PROCESSED":
        return "รอดำเนินการ";
      case "PROCESSING":
        return "กำลังดำเนินการ";
      case "DELIVERED":
        return "จัดส่งสำเร็จ";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  // Helper: days since a date (returns number of full days)
  const daysSince = (dateStr) => {
    if (!dateStr) return Infinity;
    const t = new Date(dateStr).getTime();
    if (isNaN(t)) return Infinity;
    const diff = Date.now() - t;
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  };

  const openModal = (order) => {
    // Close other modals first to avoid nested Headless UI Dialogs which can
    // trigger internal React / Headless UI focus-management errors when two
    // Dialogs are rendered/open at the same time.
    setIsReviewOpen(false);
    setIsReturnOpen(false);
    setIsCancelModalOpen(false);
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const openReviewModal = (product, variant, order) => {
    // ensure no other dialogs are open before opening review modal
    setIsModalOpen(false);
    setIsReturnOpen(false);
    setIsCancelModalOpen(false);
    // merge variant into product object for ReviewModal to consume
    if (product && variant) {
      try {
        setReviewProduct({ ...product, variant });
      } catch {
        setReviewProduct(product);
      }
    } else {
      setReviewProduct(product);
    }
    setReviewOrderId(order?._id || order?.id || null);
    setReviewOrderUpdatedAt(order?.updatedAt || order?.createdAt || null);
    // actually open the review modal UI
    setIsReviewOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewOpen(false);
    setReviewProduct(null);
    setReviewOrderId(null);
    setReviewOrderUpdatedAt(null);
    hdlGetOrders(token); // Refresh orders after review
  };

  // --- Return Product Modal State ---
  const openReturnModal = (order) => {
    // close other dialogs to avoid nesting
    setIsModalOpen(false);
    setIsReviewOpen(false);
    setIsCancelModalOpen(false);
    setReturnOrder(order);
    setSelectedReturnProducts([]);
    setReturnReason("");
    setCustomReason("");
    setReturnImages([]);
    setStep(1);
    setIsReturnOpen(true);
  };

  const closeReturnModal = () => {
    setIsReturnOpen(false);
    setReturnOrder(null);
    setSelectedReturnProducts([]);
    setReturnReason("");
    setCustomReason("");
    setReturnImages([]);
    setStep(1);
  };

  // Handle Return Submit (connect to backend)
  const handleReturnSubmit = async () => {
    setReturnLoading(true);
    try {
      const orderId = returnOrder._id || returnOrder.id;
      const productIds = selectedReturnProducts;
      const reason = returnReason === "อื่น ๆ" ? customReason : returnReason;
      // Require at least 2 images attached
      if (!returnImages || returnImages.length < 2) {
        toast.error("กรุณาแนบรูปสินค้าที่จะคืนอย่างน้อย 2 รูป");
        setReturnLoading(false);
        return;
      }
      const backendUrl = import.meta.env.VITE_API || "/api";
      // Build FormData to include images
      const fd = new FormData();
      fd.append("productIds", JSON.stringify(productIds));
      fd.append("reason", reason || "");
      returnImages.forEach((f) => fd.append("images", f));

      const res = await fetch(`${backendUrl}/user/order/${orderId}/return`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการคืนสินค้า");
      }
      toast.success("ส่งคำขอคืนสินค้าเรียบร้อยแล้ว!");
      closeReturnModal();
      hdlGetOrders(token); // Refresh orders after return
    } catch (err) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการส่งคำขอคืนสินค้า");
    }
    setReturnLoading(false);
  };

  // ฟังก์ชันตัวกรองสถานะ — คลิกเลือกจะตั้งค่า activeStatus, คลิกซ้ำจะยกเลิก (แสดงทั้งหมด)
  const handleFilterClick = (statusKey) => {
    setActiveStatus((prev) => (prev === statusKey ? null : statusKey));
  };

  // compute reminders: delivered orders within last 14 days not dismissed
  useEffect(() => {
    const rem = recomputeReviewReminders();
    if (rem && rem.length > 0) {
      // toast.info(
      //   `คุณมี ${rem.length} คำสั่งซื้อที่จัดส่งสำเร็จและยังไม่ได้รีวิว`,
      //   { autoClose: 5000 }
      // );
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("เตือนรีวิวสินค้า", {
            body: `คุณมี ${rem.length} คำสั่งซื้อที่ยังไม่ได้รีวิว`,
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((p) => {
            if (p === "granted") {
              new Notification("เตือนรีวิวสินค้า", {
                body: `คุณมี ${rem.length} คำสั่งซื้อที่ยังไม่ได้รีวิว`,
              });
            }
          });
        }
      }
    }
  }, [recomputeReviewReminders]);

  // dismissed reminders are handled via dismissAllReminders; helper removed

  // helper to mark/unmark a product as reviewed
  // markProductReviewed now accepts optional variantId and will set variant-aware key first
  const markProductReviewed = (productId, timestamp, variantId) => {
    if (!productId) return;
    const key = makeReviewedKey(productId, variantId);
    const ts = timestamp || Date.now();
    setReviewedProducts((prev) => {
      const next = { ...(prev || {}) };
      next[key] = Number(ts) || Date.now();
      try {
        localStorage.setItem("reviewedProducts", JSON.stringify(next));
      } catch (e) {
        console.debug(e);
      }
      // recompute reminders immediately using updated list
      setTimeout(() => recomputeReviewReminders(), 0);
      // refresh orders so list UI updates (ensure parent sees changes from backend)
      try {
        if (typeof hdlGetOrders === "function") hdlGetOrders(token);
      } catch (e) {
        console.debug(e);
      }

      // If bulk-review mode is active, continue to the next product in the queue
      try {
        if (bulkReviewMode) {
          const remaining = (bulkQueueProducts || []).filter((p) => {
            const id = String(p._id || p.id || "");
            if (!id) return false;
            if (Object.prototype.hasOwnProperty.call(next, id)) return false;
            // check for any variant keys stored like "<id>:<variantId>"
            const hasVariantKey = Object.keys(next).some((k) =>
              k.startsWith(id + ":")
            );
            return !hasVariantKey;
          });
          if (remaining.length > 0) {
            // find next with order context from pendingReviewItems
            const nextProd = remaining[0];
            const nextItem = (pendingReviewItems || []).find((it) => {
              const idA = String(it.product?._id || it.product?.id || "");
              const idB = String(nextProd._id || nextProd.id || "");
              return idA && idA === idB;
            });
            // open next product after a short delay to allow modal transitions
            setTimeout(() => {
              if (nextItem && nextItem.product) {
                openReviewModal(
                  nextItem.product,
                  nextItem.product.variant,
                  nextItem.order
                );
              } else {
                openReviewModal(nextProd);
              }
            }, 300);
            setBulkQueueProducts(remaining);
          } else {
            setBulkReviewMode(false);
            setBulkQueueProducts([]);
            toast.success("รีวิวสินค้าทั้งหมดเรียบร้อยแล้ว");
          }
        }
      } catch (err) {
        console.debug(err);
      }

      return next;
    });
  };

  // unmark supports optional variantId; if variantId provided removes specific key, else remove product and variant keys
  const unmarkProductReviewed = (productId, variantId) => {
    if (!productId) return;
    const prodIdStr = String(productId);
    const specificKey = variantId
      ? makeReviewedKey(productId, variantId)
      : null;
    setReviewedProducts((prev) => {
      const next = { ...(prev || {}) };
      if (specificKey) {
        delete next[specificKey];
      } else {
        // remove both product key and any variant keys that start with productId:
        delete next[prodIdStr];
        Object.keys(next).forEach((k) => {
          if (k.startsWith(prodIdStr + ":")) delete next[k];
        });
      }
      try {
        localStorage.setItem("reviewedProducts", JSON.stringify(next));
      } catch (e) {
        console.debug(e);
      }
      setTimeout(() => recomputeReviewReminders(), 0);
      try {
        if (typeof hdlGetOrders === "function") hdlGetOrders(token);
      } catch (e) {
        console.debug(e);
      }
      return next;
    });
  };

  // Build flat list of pending product items to review (product + order)
  const pendingReviewItems = useMemo(() => {
    if (!reviewReminders || reviewReminders.length === 0) return [];
    const items = [];
    reviewReminders.forEach((order) => {
      (order.products || []).forEach((p) => {
        const pid = String(p.product?._id || p.product?.id || "");
        const vid = String(
          p.variant?.id || p.variant?._id || p.variant?.variantId || ""
        );
        if (!pid) return; // skip unknown
        const variantKey = vid ? `${pid}:${vid}` : null;
        const lastReviewedVariant = variantKey
          ? Number(reviewedProducts[variantKey]) || 0
          : 0;
        const lastReviewedProduct = Number(reviewedProducts[pid]) || 0;
        const lastReviewed = Math.max(lastReviewedVariant, lastReviewedProduct);
        const orderUpdated = new Date(order.updatedAt).getTime() || 0;
        if (lastReviewed >= orderUpdated) return; // skip if already reviewed after this order
        // prefer to merge variant data into the product object so downstream
        // review flows (bulk/single) can access sub-product images/sku/price
        const prodWithVariant = p.variant
          ? { ...(p.product || {}), variant: p.variant }
          : p.product;
        items.push({ product: prodWithVariant, order });
      });
    });
    return items;
  }, [reviewReminders, reviewedProducts]);

  const pendingReviewCount = pendingReviewItems.length;

  // Open ReviewModal for the first unreviewed product from the first reminder order
  const openFirstUnreviewedProductForReview = () => {
    if (!reviewReminders || reviewReminders.length === 0) return;
    const order = reviewReminders[0];
    if (!order || !order.products || order.products.length === 0) return;
    const productEntry =
      order.products.find((p) => {
        const pid = String(p.product?._id || p.product?.id || "");
        const vid = String(
          p.variant?.id || p.variant?._id || p.variant?.variantId || ""
        );
        if (!pid) return false;
        const variantKey = vid ? `${pid}:${vid}` : null;
        const lastReviewedVariant = variantKey
          ? Number(reviewedProducts[variantKey]) || 0
          : 0;
        const lastReviewedProduct = Number(reviewedProducts[pid]) || 0;
        const lastReviewed = Math.max(lastReviewedVariant, lastReviewedProduct);
        const orderUpdated = new Date(order.updatedAt).getTime() || 0;
        return lastReviewed < orderUpdated;
      }) || order.products[0];
    if (productEntry) {
      // close order modal if open, then open review modal with order context
      if (isModalOpen) closeModal();
      openReviewModal(
        productEntry.product,
        productEntry.variant || productEntry.product.variant,
        order
      );
    }
  };

  // Dismiss all current reminders (mark orders as dismissed)
  const dismissAllReminders = () => {
    if (!reviewReminders || reviewReminders.length === 0) return;
    const ids = reviewReminders
      .map((o) => o._id || o.id || o.orderId)
      .filter(Boolean);
    const next = Array.from(new Set([...(dismissedReminders || []), ...ids]));
    setDismissedReminders(next);
    try {
      localStorage.setItem("dismissedReviewReminders", JSON.stringify(next));
    } catch (e) {
      console.debug(e);
    }
    setReviewReminders([]);
  };

  // helper to toggle and persist sort order
  const toggleSortOrder = (value) => {
    try {
      setSortOrder(value);
      localStorage.setItem("ordersSortOrder", value);
    } catch (err) {
      console.debug(err);
    }
  };

  // Compute displayed orders applying filter and sort preference
  const displayedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const filtered = (orders || []).filter((order) => {
      if (!activeStatus) return true;
      if (activeStatus === "CANCELLED")
        return (
          order.orderStatus === "CANCELLED" || order.orderStatus === "Cancelled"
        );
      return order.orderStatus === activeStatus;
    });
    // orders are already fetched in newest-first by default; allow oldest-first
    if (sortOrder === "oldest") return filtered.slice().reverse();
    return filtered;
  }, [orders, activeStatus, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-slate-50 min-h-screen">
      {/* Reminder banner: show when there are review reminders */}
      {reviewReminders.length > 0 && (
        <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 via-white to-amber-50 border-l-4 border-amber-400 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-4">
            <BadgeCheck className="text-amber-600" size={28} />
            <div>
              <p className="font-semibold text-slate-800">
                คุณยังไม่ได้รีวิวสินค้าบางรายการ
              </p>
              <p className="text-sm text-slate-600">
                มี {pendingReviewCount} สินค้าที่จัดส่งสำเร็จและยังไม่ได้รีวิว —
                ช่วยเขียนรีวิวสั้นๆ เพื่อแบ่งปันความคิดเห็นของคุณ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openFirstUnreviewedProductForReview}
              className="px-5 py-2 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              รีวิวสินค้า
            </button>
            <button
              onClick={startBulkReview}
              className="px-5 py-2 bg-amber-600 text-white rounded-full font-semibold hover:bg-amber-700 transition-colors shadow-sm animate-pulse"
            >
              รีวิวทั้งหมด
            </button>
            <button
              onClick={dismissAllReminders}
              className="px-5 py-2 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
            >
              ข้ามไปก่อน
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-12">
        <div className="bg-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-center">
          <ShoppingCart className="text-slate-600" size={36} />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            ประวัติการสั่งซื้อ
          </h1>
          <p className="text-slate-500 mt-1">
            ติดตามและจัดการคำสั่งซื้อของคุณทั้งหมดได้ที่นี่
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-slate-600">เรียงตาม:</span>
            <button
              onClick={() => toggleSortOrder("newest")}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                sortOrder === "newest"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              ใหม่สุด
            </button>
            <button
              onClick={() => toggleSortOrder("oldest")}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                sortOrder === "oldest"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              เก่าสุด
            </button>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* All */}
          <button
            type="button"
            onClick={() => handleFilterClick(null)}
            className={`group flex flex-col items-center bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border text-sm font-medium ${
              activeStatus === null
                ? "ring-2 ring-offset-2 ring-blue-500 transform -translate-y-1"
                : "hover:-translate-y-1"
            }`}
            aria-pressed={activeStatus === null}
          >
            <ShoppingCart className="w-8 h-8 text-slate-500 mb-2 group-hover:text-blue-600 transition-colors" />
            <span className="text-slate-700 font-semibold">ทั้งหมด</span>
            <span className="mt-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">
              {orders.length}
            </span>
          </button>

          {/* NOT_PROCESSED */}
          <button
            type="button"
            onClick={() => handleFilterClick("NOT_PROCESSED")}
            className={`group flex flex-col items-center bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border text-sm font-medium ${
              activeStatus === "NOT_PROCESSED"
                ? "ring-2 ring-offset-2 ring-yellow-500 transform -translate-y-1"
                : "hover:-translate-y-1"
            }`}
            aria-pressed={activeStatus === "NOT_PROCESSED"}
          >
            <AlertCircle className="w-8 h-8 text-slate-500 mb-2 group-hover:text-yellow-600 transition-colors" />
            <span className="text-slate-700 font-semibold">รอดำเนินการ</span>
            <span className="mt-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-bold">
              {statusSummary?.NOT_PROCESSED ?? 0}
            </span>
          </button>

          {/* PROCESSING */}
          <button
            type="button"
            onClick={() => handleFilterClick("PROCESSING")}
            className={`group flex flex-col items-center bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border text-sm font-medium ${
              activeStatus === "PROCESSING"
                ? "ring-2 ring-offset-2 ring-sky-500 transform -translate-y-1"
                : "hover:-translate-y-1"
            }`}
            aria-pressed={activeStatus === "PROCESSING"}
          >
            <Truck className="w-8 h-8 text-slate-500 mb-2 group-hover:text-sky-600 transition-colors" />
            <span className="text-slate-700 font-semibold">กำลังดำเนินการ</span>
            <span className="mt-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-sm font-bold">
              {statusSummary?.PROCESSING ?? 0}
            </span>
          </button>

          {/* DELIVERED */}
          <button
            type="button"
            onClick={() => handleFilterClick("DELIVERED")}
            className={`group flex flex-col items-center bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border text-sm font-medium ${
              activeStatus === "DELIVERED"
                ? "ring-2 ring-offset-2 ring-green-500 transform -translate-y-1"
                : "hover:-translate-y-1"
            }`}
            aria-pressed={activeStatus === "DELIVERED"}
          >
            <CheckCircle className="w-8 h-8 text-slate-500 mb-2 group-hover:text-green-600 transition-colors" />
            <span className="text-slate-700 font-semibold">เสร็จสิ้น</span>
            <span className="mt-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-bold">
              {statusSummary?.DELIVERED ?? 0}
            </span>
          </button>

          {/* CANCELLED */}
          <button
            type="button"
            onClick={() => handleFilterClick("CANCELLED")}
            className={`group flex flex-col items-center bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border text-sm font-medium ${
              activeStatus === "CANCELLED"
                ? "ring-2 ring-offset-2 ring-rose-500 transform -translate-y-1"
                : "hover:-translate-y-1"
            }`}
            aria-pressed={activeStatus === "CANCELLED"}
          >
            <Ban className="w-8 h-8 text-slate-500 mb-2 group-hover:text-rose-600 transition-colors" />
            <span className="text-slate-700 font-semibold">ยกเลิก</span>
            <span className="mt-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-sm font-bold">
              {statusSummary?.CANCELLED ?? 0}
            </span>
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md border p-6 h-56 flex flex-col gap-4"
            >
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 bg-slate-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="mt-auto h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center mt-24 text-slate-500 animate-fade-in">
          <PackageSearch size={80} className="mb-6 text-slate-300" />
          <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-slate-600">
            ยังไม่มีประวัติคำสั่งซื้อ
          </h2>
          <p className="text-lg md:text-xl mt-2 text-slate-400 max-w-md">
            ดูเหมือนว่าคุณยังไม่เคยสั่งซื้อสินค้าเลย
            เริ่มช้อปปิ้งเพื่อดูรายการคำสั่งซื้อของคุณได้ที่นี่
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            เลือกซื้อสินค้า
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {displayedOrders.map((order, index) => (
            <div
              key={order._id || index}
              className="bg-white rounded-2xl shadow-md border hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="text-blue-500" size={22} />
                  <div>
                    <span className="text-lg font-bold text-slate-800">
                      คำสั่งซื้อ #{order._id?.slice(-6) || index + 1}
                    </span>
                    <p className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {translateStatus(order.orderStatus)}
                </span>
              </div>

              {/* Products */}
              <div className="p-6 space-y-4 flex-grow">
                {order.products.slice(0, 2).map((p, idx) => {
                  const pid = String(p.product?._id || p.product?.id || "");
                  const vid = String(
                    p.variant?.id ||
                      p.variant?._id ||
                      p.variant?.variantId ||
                      ""
                  );
                  const orderUpdated = new Date(order.updatedAt).getTime() || 0;
                  // prefer variant-specific key, then fallback to product-only key
                  const variantKey = vid ? `${pid}:${vid}` : null;
                  const lastReviewedVariant = variantKey
                    ? Number(reviewedProducts[variantKey]) || 0
                    : 0;
                  const lastReviewedProduct =
                    Number(reviewedProducts[pid]) || 0;
                  const lastReviewed = Math.max(
                    lastReviewedVariant,
                    lastReviewedProduct
                  );
                  const isReviewed = pid && lastReviewed >= orderUpdated;

                  // Prefer variant data when available
                  const displayImage =
                    (p.variant &&
                      ((p.variant.images && p.variant.images[0]?.url) ||
                        (p.variant.images && p.variant.images[0]) ||
                        p.variant.image)) ||
                    (p.product &&
                      ((p.product.images && p.product.images[0]?.url) ||
                        (p.product.images && p.product.images[0]) ||
                        p.product.image)) ||
                    null;

                  const displayTitle = p.variant?.title
                    ? `${p.product?.title || ""} - ${p.variant.title}`
                    : p.product?.title || "ไม่ระบุชื่อสินค้า";

                  // Unit price: use recorded order price first, then variant price, then product price
                  const unitPrice =
                    typeof p.price === "number"
                      ? p.price
                      : p.variant?.price ?? p.product?.price ?? 0;

                  return (
                    <div key={idx} className="flex items-start gap-4">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={displayTitle}
                          className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/80x80?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                          ไม่มีรูป
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {displayTitle}
                        </p>
                        <p className="text-sm text-slate-500">
                          จำนวน: {p.count}
                        </p>
                        <p className="text-sm font-bold text-blue-600 mt-1">
                          {numberFormat(unitPrice * (p.count || 0))} ฿
                        </p>

                        {order.orderStatus === "DELIVERED" && (
                          <div className="mt-2">
                            {isReviewed ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openReviewModal(p.product, p.variant, order)
                                }
                                className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors font-medium"
                              >
                                ดูรีวิว
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  openReviewModal(p.product, p.variant, order)
                                }
                                className="text-xs px-3 py-1 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors font-medium"
                              >
                                เขียนรีวิว
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {order.products.length > 2 && (
                  <p className="text-sm text-slate-500 text-center pt-2">
                    + และอีก {order.products.length - 2} รายการ
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-slate-50 rounded-b-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm font-medium text-slate-600">
                  ยอดรวม:{" "}
                  <span className="text-xl font-bold text-blue-700">
                    {numberFormat(order.cartTotal)} ฿
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openModal(order)}
                    className="px-5 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    ดูรายละเอียด
                  </button>

                  {order.orderStatus === "NOT_PROCESSED" && (
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setIsReviewOpen(false);
                        setIsReturnOpen(false);
                        setCancelOrderDetail({
                          orderId: order._id || order.id,
                          itemCount: order.products.length,
                          total: order.cartTotal,
                        });
                        setIsCancelModalOpen(true);
                      }}
                      className="px-5 py-2 bg-rose-500 text-white rounded-full font-semibold hover:bg-rose-600 transition-colors shadow-sm"
                    >
                      ยกเลิก
                    </button>
                  )}

                  {/* Return button: show for delivered orders and only if there's no pending return request */}
                  {order.orderStatus === "DELIVERED" &&
                    !(
                      Array.isArray(order.returnRequests) &&
                      order.returnRequests.some((rr) => rr.status === "PENDING")
                    ) &&
                    // hide return button if more than 1 day has passed since delivery
                    daysSince(order.updatedAt || order.deliveredAt) <= 1 && (
                      <button
                        onClick={() => openReturnModal(order)}
                        className="px-5 py-2 bg-yellow-500 text-white rounded-full font-semibold hover:bg-yellow-600 transition-colors shadow-sm"
                      >
                        คืนสินค้า
                      </button>
                    )}

                  {/* If there are any return requests for this order, show link to details */}
                  {Array.isArray(order.returnRequests) &&
                    order.returnRequests.length > 0 && (
                      <button
                        onClick={() => {
                          const rr = order.returnRequests[0];
                          const rrId = rr.id || rr.returnRequestId || rr._id;
                          if (rrId)
                            window.location.href = `/user/return-request/${rrId}`;
                        }}
                        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                      >
                        ดูรายละเอียดการคืน
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals: Order details, Review, Return and Cancel */}
      {isModalOpen && (
        <OrderDetailsModal
          isOpen={isModalOpen}
          closeModal={closeModal}
          order={selectedOrder}
          translateStatus={translateStatus}
          getStatusColor={getStatusColor}
          openReviewModal={(product, variant, order) => {
            // ensure order modal closes before opening review
            closeModal();
            openReviewModal(product, variant, order);
          }}
          reviewedProducts={reviewedProducts}
        />
      )}

      {isReviewOpen && (
        <ReviewModal
          isOpen={isReviewOpen}
          closeModal={closeReviewModal}
          product={reviewProduct}
          token={token}
          reviewOrderId={reviewOrderId}
          reviewOrderUpdatedAt={reviewOrderUpdatedAt}
          onReviewSubmitted={markProductReviewed}
          onReviewDeleted={unmarkProductReviewed}
        />
      )}

      {isReturnOpen && (
        <ReturnProductModal
          isOpen={isReturnOpen}
          closeModal={closeReturnModal}
          order={returnOrder}
          handleReturnSubmit={handleReturnSubmit}
          selectedReturnProducts={selectedReturnProducts}
          setSelectedReturnProducts={setSelectedReturnProducts}
          returnReason={returnReason}
          setReturnReason={setReturnReason}
          customReason={customReason}
          setCustomReason={setCustomReason}
          returnImages={returnImages}
          setReturnImages={setReturnImages}
          returnLoading={returnLoading}
          step={step}
          setStep={setStep}
        />
      )}

      {isCancelModalOpen && (
        <CancelOrderModal
          isOpen={isCancelModalOpen}
          closeModal={closeCancelModal}
          cancelLoading={cancelLoading}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          customCancelReason={customCancelReason}
          setCustomCancelReason={setCustomCancelReason}
          handleCancelSubmit={handleCancelSubmit}
          cancelOrderDetail={cancelOrderDetail}
        />
      )}
    </div>
  );
};

export default HistoryCard;
