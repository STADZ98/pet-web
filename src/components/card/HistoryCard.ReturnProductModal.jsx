import React from "react";
import { X, Ban, ChevronRight, ChevronLeft } from "lucide-react";

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
    (!returnReason || (returnReason === "อื่น ๆ" && !customReason));

  const selectedItems = order.products.filter((p) =>
    selectedReturnProducts.includes(p.product._id || p.product.id)
  );
  const refundTotal = selectedItems.reduce(
    (sum, p) => sum + p.count * (p.product.price || 0),
    0
  );

  return (
    <div open={isOpen} onClose={closeModal} className="relative z-[1001]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl border border-gray-200 animate-fade-in">
          <div className="sticky top-0 z-10 flex justify-between items-center px-8 py-5 border-b bg-gradient-to-r from-red-50 to-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <Ban className="text-red-500" size={28} />
              <div>
                <div className="text-lg font-bold text-gray-900">
                  คืนสินค้า/คืนเงิน
                </div>
                <div className="text-sm text-gray-500">
                  คำสั่งซื้อ #{order._id || order.id}
                </div>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
            >
              <X size={22} />
            </button>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-6 mb-6">
              <div
                className={`flex items-center gap-3 ${
                  step === 1 ? "text-red-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                    step === 1
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  1
                </div>
                <div className="text-sm">เลือกสินค้า</div>
              </div>
              <div
                className={`flex items-center gap-3 ${
                  step === 2 ? "text-red-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                    step === 2
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  2
                </div>
                <div className="text-sm">เหตุผล & ยืนยัน</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {step === 1 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      เลือกสินค้าที่ต้องการคืน
                    </h3>
                    <div className="grid grid-cols-1 gap-4 mt-4">
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
                          <div
                            key={prodId}
                            className={`flex items-center gap-4 p-4 rounded-lg border ${
                              isSelected
                                ? "ring-1 ring-red-100 bg-red-50"
                                : "bg-white border-gray-100 hover:shadow-sm"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(prodId)}
                              className="h-5 w-5 text-red-600"
                            />
                            <img
                              src={imgSrc}
                              alt={p.variant?.title || p.product.title}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {p.product.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                จำนวน:{" "}
                                <span className="font-semibold text-gray-700">
                                  {p.count}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                ราคา:{" "}
                                <span className="font-semibold text-gray-800">
                                  {(p.product.price || 0).toLocaleString()} ฿
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-red-600">
                                {(
                                  p.count * (p.product.price || 0)
                                ).toLocaleString()}{" "}
                                ฿
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={() => setStep(2)}
                        disabled={isNextStepDisabled}
                        className={`px-5 py-2 rounded-md font-semibold ${
                          isNextStepDisabled
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        ดำเนินการต่อ{" "}
                        <ChevronRight size={18} className="inline-block ml-1" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      ระบุเหตุผลการคืนสินค้า
                    </h3>
                    <div className="space-y-3 mt-4">
                      {[
                        "สินค้าชำรุด/เสียหาย",
                        "สินค้าไม่ตรงตามคำสั่งซื้อ",
                        "เปลี่ยนใจ",
                        "อื่น ๆ",
                      ].map((reason) => (
                        <label
                          key={reason}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            returnReason === reason
                              ? "bg-red-50 border-red-100"
                              : "bg-white border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="returnReason"
                            checked={returnReason === reason}
                            onChange={() => {
                              setReturnReason(reason);
                              if (reason !== "อื่น ๆ") setCustomReason("");
                            }}
                            className="h-4 w-4 text-red-600"
                          />
                          <span className="font-medium text-gray-800">
                            {reason}
                          </span>
                        </label>
                      ))}
                      {returnReason === "อื่น ๆ" && (
                        <textarea
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="โปรดระบุเหตุผลเพิ่มเติม..."
                          className="w-full border rounded-md p-3 resize-none min-h-[120px] focus:ring-2 focus:ring-red-500"
                        />
                      )}
                    </div>
                    <div className="flex justify-between mt-6">
                      <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2 rounded-md font-medium text-gray-700 bg-white border hover:bg-gray-50 flex items-center gap-2"
                      >
                        <ChevronLeft size={18} /> ย้อนกลับ
                      </button>
                      <button
                        onClick={handleReturnSubmit}
                        disabled={isSubmitDisabled || returnLoading}
                        className={`px-4 py-2 rounded-md font-semibold ${
                          isSubmitDisabled || returnLoading
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        {returnLoading
                          ? "กำลังส่งคำขอ..."
                          : "ยืนยันการคืนสินค้า"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 sticky top-6">
                  <div className="text-sm text-gray-500">
                    สรุปรายการที่เลือก
                  </div>
                  <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                    {selectedItems.length === 0 ? (
                      <div className="text-sm text-gray-400">
                        ยังไม่เลือกสินค้า
                      </div>
                    ) : (
                      selectedItems.map((p) => (
                        <div
                          key={(p.product._id || p.product.id) + "-sum"}
                          className="flex items-center justify-between"
                        >
                          <div className="text-sm text-gray-700">
                            {p.product.title} x{p.count}
                          </div>
                          <div className="font-semibold text-gray-900">
                            {(
                              p.count * (p.product.price || 0)
                            ).toLocaleString()}{" "}
                            ฿
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 border-t pt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div>ยอดคืนสุทธิ</div>
                      <div className="font-bold text-lg text-red-600">
                        {refundTotal.toLocaleString()} ฿
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      ยอดอาจเปลี่ยนแปลงเมื่อมีค่าธรรมเนียมหรือส่วนลด
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnProductModal;
