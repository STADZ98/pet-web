import React, { useEffect, useState, useMemo } from "react";
import {
  PaymentElement,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { saveOrder, listUserCart } from "../api/user";
import useEcomStore from "../store/ecom-store";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { numberFormat } from "../utils/number";
import {
  ShoppingBag,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  User,
  ExternalLink,
  Clipboard,
} from "lucide-react";

// --- Components ที่แยกออกมาเพื่อให้โค้ดหลักสะอาดขึ้น ---

/**
 * @description แสดงสถานะขั้นตอนการชำระเงิน
 * @param {number} currentStep - เลขขั้นตอนปัจจุบัน
 */
const CheckoutSteps = ({ currentStep }) => {
  const steps = [
    { name: "ตะกร้าสินค้า", step: 1 },
    { name: "ที่อยู่จัดส่ง", step: 2 },
    { name: "ชำระเงิน", step: 3 },
  ];
  return (
    <div className="flex items-center justify-center mb-8 text-center text-sm font-medium text-gray-500">
      {steps.map((step, index) => (
        <React.Fragment key={step.step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-300 ${
                step.step === currentStep
                  ? "bg-yellow-500"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {step.step}
            </div>
            <span className="mt-2 text-xs">{step.name}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-14 h-0.5 mx-2 transition-colors duration-300 ${
                step.step < currentStep ? "bg-yellow-400" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * @description แสดงรายการสินค้าและข้อมูลสรุป
 * @param {object} props
 * @param {array} props.products - รายการสินค้า
 * @param {number} props.cartTotal - ยอดรวม
 * @param {boolean} props.loading - สถานะกำลังโหลด
 */
const OrderSummary = ({ products, cartTotal, loading }) => {
  const navigate = useNavigate();

  // Helper function to resolve image URLs (can be a standalone utility)
  const resolveImageSrc = (image) => {
    // simplified for brevity - assumes a single string URL
    return (
      image ||
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full text-gray-300"><path d="M12 2L2 22h20L12 2z" /></svg>'
    );
  };

  const getFirstImageFromProduct = (product) => {
    if (!product) return null;
    const imgs = product.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
      const first = imgs[0];
      if (typeof first === "string") return first;
      if (typeof first === "object")
        return first.url || first.secure_url || null;
    }
    return product.image || product.picture || null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 items-center bg-gray-100 p-4 rounded-lg animate-pulse"
          >
            <div className="w-16 h-16 bg-gray-200 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-lg font-medium">ไม่มีสินค้าในตะกร้า</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
        >
          เลือกซื้อสินค้า
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between text-2xl font-extrabold text-gray-800 mb-6">
        <h2 className="flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-amber-600" />
          สรุปรายการสินค้า
        </h2>
        <span className="text-xl font-bold text-gray-900">
          {numberFormat(cartTotal)} ฿
        </span>
      </div>
      <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
        {products.map((item, index) => {
          const product = item.product;
          const variant = item.variant;
          const count = item.count ?? 1;
          const unitPrice = item.price ?? variant?.price ?? product?.price ?? 0;
          const imgUrl = resolveImageSrc(
            getFirstImageFromProduct(variant || product)
          );
          const title = variant?.title || product?.title || "สินค้า";

          return (
            <li
              key={index}
              className="flex gap-4 items-center p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm"
            >
              <div className="flex-shrink-0 w-20 h-20 bg-white rounded-lg overflow-hidden border">
                <img
                  src={imgUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = resolveImageSrc(null);
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  จำนวน: {count} ชิ้น
                </p>
              </div>
              <p className="font-bold text-gray-900 whitespace-nowrap">
                {numberFormat(count * unitPrice)} ฿
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
};

/**
 * @description แสดงข้อมูลผู้รับและที่อยู่จัดส่ง
 * @param {object} props
 * @param {string} props.name - ชื่อผู้รับ
 * @param {string} props.address - ที่อยู่
 * @param {string} props.telephone - เบอร์โทรศัพท์
 * @param {Function} props.onEdit - ฟังก์ชันสำหรับแก้ไข
 */
const ShippingDetails = ({ name, address, telephone, onEdit }) => (
  <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-indigo-500" />
        ที่อยู่จัดส่ง
      </h3>
      <button
        onClick={onEdit}
        className="text-sm text-indigo-600 hover:underline"
      >
        แก้ไข
      </button>
    </div>
    <div className="mt-4 space-y-2 text-gray-600">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-gray-400" />
        <p>
          <span className="font-semibold">ผู้รับ:</span> {name || "-"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-gray-400" />
        <p>
          <span className="font-semibold">ที่อยู่:</span> {address || "-"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Phone className="w-5 h-5 text-gray-400" />
        <p>
          <span className="font-semibold">โทรศัพท์:</span> {telephone || "-"}
        </p>
      </div>
    </div>
  </div>
);

/**
 * @description แสดงข้อมูลการชำระเงินของ Stripe
 * @param {object} props
 * @param {string} props.clientSecret - clientSecret จาก PaymentIntent
 * @param {string[]} props.supportedMethods - ช่องทางการชำระเงินที่รองรับ
 */
const PaymentInfo = ({ piInfo }) => {
  const supportedMethods = useMemo(
    () =>
      Array.isArray(piInfo?.payment_method_types)
        ? piInfo.payment_method_types
        : [],
    [piInfo]
  );

  return (
    <div className="text-sm text-gray-600">
      <div className="flex items-center gap-3">
        <p className="font-medium text-gray-800">
          ช่องทางการชำระเงินที่รองรับ:
        </p>
        {supportedMethods.length === 0 ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจสอบ...
          </span>
        ) : (
          <>
            {supportedMethods.includes("card") && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
                บัตรเครดิต/เดบิต
              </span>
            )}
            {supportedMethods.includes("promptpay") && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm">
                PromptPay
              </span>
            )}
          </>
        )}
      </div>
      {supportedMethods.length === 0 && (
        <p className="mt-2 text-red-600">
          ไม่พบช่องทางการชำระเงิน กรุณาติดต่อผู้ดูแลระบบ
        </p>
      )}
    </div>
  );
};

const PromptPayQr = ({ piInfo }) => {
  const qrData = piInfo?.next_action?.promptpay_display_qr_code;
  if (!qrData) return null;

  const handleCopy = async (text, successMsg, failMsg) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg);
    } catch {
      toast.error(failMsg);
    }
  };

  return (
    <div className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-start gap-6">
        <img
          src={qrData.image_url_png}
          alt="PromptPay QR"
          className="w-40 h-40 object-contain rounded-md border-2 border-gray-200"
        />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">PromptPay QR Code</h3>
          <p className="text-sm text-gray-600 mt-2">
            สแกน QR Code ด้วยแอปธนาคารเพื่อชำระเงิน ยอดรวม:{" "}
            <span className="font-bold text-yellow-600">
              {numberFormat(piInfo.amount / 100)} ฿
            </span>
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  qrData.hosted_instructions_url,
                  "คัดลอกลิงก์คำแนะนำ PromptPay แล้ว",
                  "คัดลอกไม่สำเร็จ"
                )
              }
              className="inline-flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <Clipboard className="w-4 h-4 mr-2" />
              คัดลอกลิงก์
            </button>
            <a
              href={qrData.hosted_instructions_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              ดูคำแนะนำเต็ม
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export default function CheckoutPage({
  clientSecret,
  selectedMethod = "card",
}) {
  const { token, clearCart } = useEcomStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { addressId, address, telephone, name } = location.state || {};

  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [piInfo, setPiInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loadingCart, setLoadingCart] = useState(true);

  const fetchCart = React.useCallback(async () => {
    if (!token) return;
    setLoadingCart(true);
    try {
      const res = await listUserCart(token);
      const data = res?.data;
      let raw = [];
      if (Array.isArray(data)) raw = data;
      else if (Array.isArray(data.products)) raw = data.products;
      else if (Array.isArray(data.cart?.products)) raw = data.cart.products;
      else raw = [];

      const normalized = raw.map((it) => {
        const product =
          it.product ||
          (it.productId
            ? { id: it.productId, title: it.title, images: it.images || [] }
            : null);
        const count = it.count ?? it.quantity ?? it.qty ?? 1;
        const price =
          typeof it.price === "number"
            ? it.price
            : product?.price ?? it.unitPrice ?? 0;
        return {
          product,
          count,
          price,
          variant: it.variant || null,
          variantId: it.variantId ?? it.variant?.id ?? null,
        };
      });

      setProducts(normalized);
      setCartTotal(
        data?.cartTotal ??
          normalized.reduce((s, it) => s + (it.count || 0) * (it.price || 0), 0)
      );
    } catch (err) {
      console.error("โหลดตะกร้าล้มเหลว:", err);
      toast.error("ไม่สามารถโหลดตะกร้าสินค้าได้");
      setProducts([]);
      setCartTotal(0);
    } finally {
      setLoadingCart(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      toast.info("กรุณาเข้าสู่ระบบเพื่อดำเนินการชำระเงิน");
      navigate("/login");
      return;
    }
    fetchCart();
  }, [token, navigate, fetchCart]);

  useEffect(() => {
    if (!clientSecret || !stripe) return;
    let mounted = true;
    const fetchPi = async () => {
      try {
        const res = await stripe.retrievePaymentIntent(clientSecret);
        if (mounted) setPiInfo(res?.paymentIntent || null);
      } catch (e) {
        console.warn("retrievePaymentIntent diagnostic failed", e);
        if (mounted) setPiInfo(null);
      }
    };
    fetchPi();
    return () => {
      mounted = false;
    };
  }, [clientSecret, stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || isLoading) return;
    setIsLoading(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {},
      });

      if (error) {
        setMessage(error.message || "เกิดข้อผิดพลาดในการชำระเงิน");
        toast.error(error.message || "เกิดข้อผิดพลาดในการชำระเงิน");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        const saveRes = await saveOrder(token, {
          paymentIntent: {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
            currency: paymentIntent.currency,
            addressId,
            address,
            telephone,
            name,
          },
        });
        clearCart();
        toast.success(
          "การชำระเงินเสร็จสมบูรณ์! คำสั่งซื้อของคุณได้รับการยืนยันแล้ว"
        );
        const createdOrder = saveRes?.data?.order;
        navigate("/user/success", { state: { order: createdOrder } });
      } else {
        setMessage(
          "การชำระเงินยังไม่สมบูรณ์ กรุณาติดตามสถานะหรือลองใหม่อีกครั้ง"
        );
        toast.warning("การชำระเงินยังไม่สมบูรณ์ หรือรอการยืนยันเพิ่มเติม");
      }
    } catch (apiError) {
      console.error("API error during order save:", apiError);
      toast.error(apiError.message || "ไม่สามารถบันทึกคำสั่งซื้อได้");
      setMessage(apiError.message || "ไม่สามารถบันทึกคำสั่งซื้อได้");
    } finally {
      setIsLoading(false);
    }
  };

  const paymentElementOptions = {
    layout: "tabs",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          หน้าชำระเงิน 🛒
        </h1>
        <CheckoutSteps currentStep={3} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-8">
          {/* ส่วนสรุปคำสั่งซื้อ */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 min-h-[400px]">
            <OrderSummary
              products={products}
              cartTotal={cartTotal}
              loading={loadingCart}
            />
          </div>

          {/* ส่วนข้อมูลการชำระเงิน */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-green-600" />
              วิธีการชำระเงิน
            </h2>
            <ShippingDetails
              name={name}
              address={address}
              telephone={telephone}
              onEdit={() => navigate("/checkout")}
            />
            <PaymentInfo piInfo={piInfo} />
            <form
              id="payment-form"
              onSubmit={handleSubmit}
              className="mt-6 space-y-6"
            >
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <PaymentElement
                  id="payment-element"
                  options={paymentElementOptions}
                />
              </div>
              <PromptPayQr piInfo={piInfo} />
              <button
                disabled={isLoading || !stripe || !elements}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                  isLoading || !stripe || !elements
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 focus:outline-none focus:ring-4 focus:ring-yellow-200"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" />
                    <span>กำลังดำเนินการ...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    ยืนยันและชำระเงิน
                  </>
                )}
              </button>
              {message && (
                <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mt-2">
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
