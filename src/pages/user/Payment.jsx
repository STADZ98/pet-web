import React, { useState, useEffect, useMemo, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { payment } from "../../api/stripe";
import useEcomStore from "../../store/ecom-store";
import CheckoutForm from "../../components/CheckoutForm";
import {
  CreditCard,
  QrCode,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// ตั้งค่า Stripe Promise ไว้ที่ด้านนอกของ Component เพื่อป้องกันการโหลดซ้ำ
const stripePromise = loadStripe(
  "pk_test_51RUkFLP3zujqKqm3nHWNfgqT8PuanPtBGiiQ1YXNSWo9R5KEqDOkebTykq0L9XWURORrtEqNHgSKCEJrAVOfYMFL00Tf4HQhfB"
);

/**
 * Component สำหรับแสดงสถานะการโหลด
 */
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="p-6 rounded-full bg-yellow-50 shadow-inner">
      <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
    </div>
    <p className="mt-4 text-gray-700 font-semibold text-lg">
      กำลังเตรียมฟอร์มการชำระเงิน...
    </p>
    <p className="text-sm text-gray-500 mt-2">โปรดรอสักครู่</p>
  </div>
);

/**
 * Component สำหรับแสดงสถานะข้อผิดพลาด
 */
const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="p-4 rounded-full bg-red-50">
      <AlertCircle className="w-10 h-10 text-red-500" />
    </div>
    <p className="mt-4 text-red-700 font-semibold text-lg">{error}</p>
    <p className="text-sm text-gray-500 mt-2">
      หากปัญหายังคงอยู่ โปรดติดต่อฝ่ายสนับสนุน
    </p>
    <div className="mt-6 flex flex-col sm:flex-row gap-3">
      <button
        onClick={onRetry}
        className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        ลองใหม่อีกครั้ง
      </button>
      <a
        href="mailto:support@example.com"
        className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
      >
        ติดต่อเรา
      </a>
    </div>
  </div>
);

/**
 * Component สำหรับตัวเลือกการชำระเงิน
 */
const PaymentMethodSelector = ({ selectedMethod, onSelectMethod }) => {
  const methods = [
    { id: "card", name: "บัตรเครดิต / เดบิต", icon: CreditCard },
    { id: "promptpay", name: "พร้อมเพย์ (QR Code)", icon: QrCode },
  ];

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        เลือกช่องทางการชำระเงิน
      </h3>
      <div className="flex flex-col md:flex-row gap-4">
        {methods.map((method) => (
          <label
            key={method.id}
            aria-label={method.name}
            className={`flex-1 flex items-center p-5 rounded-xl border-2 cursor-pointer transition-colors duration-200 shadow-sm
              ${
                selectedMethod === method.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
          >
            <input
              type="radio"
              name="payment_method"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={() => onSelectMethod(method.id)}
              className="hidden"
            />
            <div className="flex items-center">
              <method.icon
                className={`w-7 h-7 mr-4 ${
                  selectedMethod === method.id
                    ? "text-indigo-600"
                    : "text-gray-400"
                }`}
              />
              <span className="text-base font-medium text-gray-800">
                {method.name}
              </span>
            </div>
            {selectedMethod === method.id && (
              <div className="ml-auto w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---
const Payment = () => {
  const token = useEcomStore((s) => s.token);
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("card");

  const fetchPaymentIntent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await payment(token, selectedMethod);
      setClientSecret(res.data.clientSecret);
    } catch (err) {
      console.error("Payment intent error:", err);
      setError("ไม่สามารถโหลดฟอร์มการชำระเงินได้ กรุณาลองใหม่อีกครั้ง");
      toast.error("ไม่สามารถโหลดฟอร์มการชำระเงินได้");
    } finally {
      setLoading(false);
    }
  }, [token, selectedMethod]);

  useEffect(() => {
    if (!token) {
      toast.info("กรุณาเข้าสู่ระบบเพื่อดำเนินการชำระเงิน");
      navigate("/login");
      return;
    }
    fetchPaymentIntent();
  }, [token, navigate, fetchPaymentIntent]);

  const options = useMemo(() => {
    const appearance = { theme: "stripe" };
    return { clientSecret, appearance };
  }, [clientSecret]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen py-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <div className="flex items-center gap-6 mb-6">
              <div className="bg-indigo-50 p-4 rounded-xl shadow-inner">
                <CreditCard className="w-9 h-9 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  ขั้นตอนสุดท้าย: ชำระเงิน
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  ยืนยันข้อมูลและเลือกช่องทางการชำระเงินที่ต้องการ
                </p>
              </div>
            </div>

            {/* Dynamic Content based on State */}
            {loading && <LoadingState />}
            {error && <ErrorState error={error} onRetry={fetchPaymentIntent} />}

            {clientSecret && !loading && !error && (
              <div className="mt-4">
                <PaymentMethodSelector
                  selectedMethod={selectedMethod}
                  onSelectMethod={setSelectedMethod}
                />
                <Elements key={clientSecret} stripe={stripePromise} options={options}>
                  <CheckoutForm clientSecret={clientSecret} selectedMethod={selectedMethod} />
                </Elements>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
