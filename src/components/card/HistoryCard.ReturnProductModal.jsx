import React, { useMemo } from "react";
import {
  X,
  Ban,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// NOTE: This component should be wrapped in React.forwardRef or ensure props are destructured correctly
const ReturnProductModal = ({
  isOpen,
  closeModal,
  order,
  handleReturnSubmit,
  selectedReturnProducts,
  setSelectedReturnProducts,
  returnReason,
  setReturnReason,
  customReason,
  setCustomReason,
  returnLoading,
  step,
  setStep,
}) => {
  if (!order) return null;

  // --- Logic Optimization with useMemo ---
  const selectedItems = useMemo(() => {
    return order.products.filter((p) =>
      selectedReturnProducts.includes(p.product._id || p.product.id)
    );
  }, [order.products, selectedReturnProducts]);

  const refundTotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, p) => sum + p.count * (p.product.price || 0),
      0
    );
  }, [selectedItems]);
  // ---------------------------------------

  const handleCheckboxChange = (productId) => {
    setSelectedReturnProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isNextStepDisabled = step === 1 && selectedReturnProducts.length === 0;
  const isSubmitDisabled =
    step === 2 &&
    (!returnReason || (returnReason === "อื่น ๆ" && !customReason.trim())); // Added trim() for robust check

  // Ensure isOpen is false to hide modal content correctly
  if (!isOpen) return null;

  return (
    // Use <dialog> for semantic correctness and better A11Y
    <dialog
      open={isOpen}
      onClose={closeModal}
      className="fixed inset-0 z-[1001] w-full h-full bg-transparent"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />
      {/* Modal Content Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          role="dialog" // ARIA role for modal content
          aria-modal="true"
          aria-labelledby="return-modal-title"
          className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl border border-gray-100 transition-transform duration-300 transform scale-100 opacity-100"
        >
          {/* Modal Header */}
          <div className="sticky top-0 z-10 flex justify-between items-center px-8 py-5 border-b bg-red-50/70 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center gap-3">
              <Ban className="text-red-600" size={28} />
              <div>
                <h2
                  id="return-modal-title"
                  className="text-xl font-bold text-gray-900"
                >
                  ยื่นคำขอคืนสินค้า/คืนเงิน
                </h2>
                <div className="text-sm text-gray-500">
                  คำสั่งซื้อ #{order._id || order.id}
                </div>
              </div>
            </div>
            <button
              onClick={closeModal}
              aria-label="ปิดหน้าต่าง"
              className="p-2 rounded-full text-gray-500 bg-white hover:bg-red-100 hover:text-red-600 transition"
            >
              <X size={22} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-8">
            {/* Step Indicator */}
            <div className="flex items-center gap-4 mb-8">
              <div
                className={`flex items-center gap-2 transition-colors ${
                  step === 1 ? "text-red-600 font-bold" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-extrabold transition-colors ${
                    step === 1
                      ? "bg-red-50 border-2 border-red-400"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  1
                </div>
                <div className="text-base">เลือกสินค้า</div>
              </div>
              <div
                className={`h-px w-12 transition-colors ${
                  step === 2 ? "bg-red-400" : "bg-gray-300"
                }`}
              />
              <div
                className={`flex items-center gap-2 transition-colors ${
                  step === 2 ? "text-red-600 font-bold" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-extrabold transition-colors ${
                    step === 2
                      ? "bg-red-50 border-2 border-red-400"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  2
                </div>
                <div className="text-base">เหตุผล & ยืนยัน</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="md:col-span-2">
                {/* Step 1: Select Products */}
                {step === 1 && (
                  <section>
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                      <CheckCircle className="inline w-5 h-5 mr-2 text-red-500" />
                      เลือกสินค้าที่ต้องการคืน
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {order.products.map((p) => {
                        const prodId = p.product._id || p.product.id;
                        const isSelected =
                          selectedReturnProducts.includes(prodId);
                        const imgSrc =
                          (p.variant &&
                            ((p.variant.images && p.variant.images[0]?.url) ||
                              (p.variant.images && p.variant.images[0]) ||
                              p.variant.image)) ||
                          (p.product &&
                            ((p.product.images && p.product.images[0]?.url) ||
                              (p.product.images && p.product.images[0]) ||
                              p.product.image)) ||
                          "";

                        return (
                          <label
                            key={prodId}
                            className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition ${
                              isSelected
                                ? "ring-2 ring-red-400 bg-red-50 border-red-200"
                                : "bg-white border-gray-200 hover:shadow-md"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(prodId)}
                              className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <img
                              src={imgSrc}
                              alt={p.variant?.title || p.product.title}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-100"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">
                                {p.product.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {p.variant?.title &&
                                  `ตัวเลือก: ${p.variant.title} | `}
                                จำนวน:{" "}
                                <span className="font-bold text-gray-700">
                                  {p.count}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <div className="font-extrabold text-lg text-red-600">
                                {(
                                  p.count * (p.product.price || 0)
                                ).toLocaleString()}{" "}
                                ฿
                              </div>
                              <div className="text-xs text-gray-400">รวม</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={() => setStep(2)}
                        disabled={isNextStepDisabled}
                        className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-1 ${
                          isNextStepDisabled
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-red-600 text-white shadow-md hover:bg-red-700"
                        }`}
                      >
                        ดำเนินการต่อ
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </section>
                )}

                {/* Step 2: Reason & Confirmation */}
                {step === 2 && (
                  <section>
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                      <AlertTriangle className="inline w-5 h-5 mr-2 text-red-500" />
                      ระบุเหตุผลการคืนสินค้า
                    </h3>
                    <div className="space-y-4">
                      {[
                        "สินค้าชำรุด/เสียหาย",
                        "สินค้าไม่ตรงตามคำสั่งซื้อ",
                        "เปลี่ยนใจ (ตามเงื่อนไข)",
                        "อื่น ๆ (โปรดระบุ)",
                      ].map((reason) => (
                        <label
                          key={reason}
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ${
                            returnReason === reason
                              ? "bg-red-50 border-red-300 ring-2 ring-red-100"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="returnReason"
                            checked={returnReason === reason}
                            onChange={() => {
                              setReturnReason(reason);
                              if (reason !== "อื่น ๆ (โปรดระบุ)")
                                setCustomReason("");
                            }}
                            className="h-5 w-5 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="font-medium text-gray-800">
                            {reason}
                          </span>
                        </label>
                      ))}
                      {returnReason === "อื่น ๆ (โปรดระบุ)" && (
                        <textarea
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="โปรดระบุเหตุผลเพิ่มเติมอย่างละเอียด..."
                          className="w-full border border-gray-300 rounded-lg p-3 resize-none min-h-[150px] shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 mt-2"
                        />
                      )}
                    </div>
                    <div className="flex justify-between mt-8">
                      <button
                        onClick={() => setStep(1)}
                        className="px-5 py-2 rounded-xl font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 flex items-center gap-1 transition"
                      >
                        <ChevronLeft size={20} /> ย้อนกลับ
                      </button>
                      <button
                        onClick={handleReturnSubmit}
                        disabled={isSubmitDisabled || returnLoading}
                        className={`px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                          isSubmitDisabled || returnLoading
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-red-600 text-white shadow-lg hover:bg-red-700"
                        }`}
                      >
                        {returnLoading ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            กำลังส่งคำขอ...
                          </>
                        ) : (
                          "ยืนยันและส่งคำขอคืนสินค้า"
                        )}
                      </button>
                    </div>
                  </section>
                )}
              </div>

              {/* Summary Sidebar */}
              <div className="md:col-span-1">
                <div className="p-5 bg-white rounded-xl border-2 border-red-100 shadow-lg sticky top-6">
                  <div className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                    สรุปยอดคืนเงิน (โดยประมาณ)
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {selectedItems.length === 0 ? (
                      <div className="text-sm text-gray-400 p-2 bg-gray-50 rounded-md">
                        <span className="block text-center">
                          โปรดเลือกสินค้าในขั้นตอนที่ 1
                        </span>
                      </div>
                    ) : (
                      selectedItems.map((p) => (
                        <div
                          key={(p.product._id || p.product.id) + "-sum"}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="text-gray-700 leading-tight">
                            {p.product.title} (x{p.count})
                          </div>
                          <div className="font-bold text-gray-900">
                            {(
                              p.count * (p.product.price || 0)
                            ).toLocaleString()}{" "}
                            ฿
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 border-t-2 border-red-200 pt-4">
                    <div className="flex items-center justify-between text-base text-gray-600">
                      <div>จำนวนสินค้าที่เลือก:</div>
                      <div className="font-bold text-gray-900">
                        {selectedItems.length} รายการ
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-lg mt-3">
                      <div className="font-bold text-red-700">ยอดคืนสุทธิ:</div>
                      <div className="font-extrabold text-2xl text-red-600">
                        {refundTotal.toLocaleString()} ฿
                      </div>
                    </div>
                    <div className="text-xs text-red-400 mt-2 p-2 bg-red-50 rounded-md">
                      <span className="font-semibold">หมายเหตุ:</span>{" "}
                      ยอดนี้เป็นยอดประมาณการ
                      ยอดสุดท้ายอาจเปลี่ยนแปลงเมื่อรวมค่าธรรมเนียม, ส่วนลด
                      หรือโปรโมชัน
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default ReturnProductModal;
