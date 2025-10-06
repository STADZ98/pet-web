import React from "react";
import { Search, RotateCcw, FileText } from "lucide-react";

export default function OrdersToolbar({
  filterStart,
  filterEnd,
  setFilterStart,
  setFilterEnd,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  resetFilters,
  pageSize,
  setPageSize,
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 font-sans">
      {/* --- Header & Title --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-block bg-blue-600 text-white rounded-full p-3 shadow-md">
            <FileText className="w-7 h-7" />
          </span>
          <h2 className="text-3xl font-bold text-gray-800">
            ระบบจัดการคำสั่งซื้อ
          </h2>
        </div>
      </div>

      {/* --- Filters & Search Bar --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        {/* Date Filters: stack on small screens, inline on sm+ */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 min-w-0">
          <label className="text-sm font-medium text-gray-700 block sm:inline-block mb-2 sm:mb-0">
            ช่วงวันที่
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
            <input
              type="date"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              max={filterEnd || undefined}
              className="w-full sm:flex-1 min-w-0 text-sm p-2 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500 text-center whitespace-nowrap">
              ถึง
            </span>
            <input
              type="date"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              min={filterStart || undefined}
              disabled={!filterStart}
              className="w-full sm:flex-1 min-w-0 text-sm p-2 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          
        </div>

        {/* Search Input */}
        <div className="relative flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="search"
            placeholder="ค้นหา (รหัส/ชื่อ/อีเมล)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-sm p-2 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
            aria-label="กรองตามสถานะ"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="NOT_PROCESSED">รอดำเนินการ</option>
            <option value="PROCESSING">กำลังดำเนินการ</option>
            <option value="DELIVERED">จัดส่งสำเร็จ</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>
        </div>

        {/* Action Buttons */}
        {/* <div className="flex items-center gap-3 justify-end p-3">
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>รีเซ็ต</span>
          </button>
        </div> */}
      </div>

      {/* --- Page Size Control --- */}
      {/* <div className="flex items-center justify-end mt-4">
        <div className="text-sm text-gray-600 mr-2">แสดงต่อหน้า:</div>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="text-sm p-2 border border-gray-300 rounded-md bg-white focus:border-blue-500 focus:ring-blue-500"
          aria-label="จำนวนคำสั่งซื้อต่อหน้า"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div> */}
    </div>
  );
}
