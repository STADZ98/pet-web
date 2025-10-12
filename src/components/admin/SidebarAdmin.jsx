import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users2,
  Layers3,
  ReceiptText,
  LogOut,
  UserRound,
  Menu,
  X,
  PackagePlus,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  ChevronDown,
  Star,
  RotateCcw, // เพิ่มไอคอนสำหรับ Dropdown
} from "lucide-react";
import { createPortal } from "react-dom";
import useEcomStore from "../../store/ecom-store";
import { uploadProfilePicture } from "../../api/user";

// --- Custom Tailwind CSS Keyframes (จำเป็นต้องเพิ่มในไฟล์ CSS หลักของคุณ เช่น index.css หรือ global.css) ---
/*
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes slideInUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; }
.animate-slide-in-up { animation: slideInUp 0.3s ease-out forwards; }
*/
// --------------------------------------------------------------------------------------------------------

// สีคลุมโทนสำหรับ Sidebar
const SIDEBAR_BG = "bg-white"; // Sidebar พื้นหลังขาว
const PRIMARY_COLOR = "blue"; // สีหลักของระบบ

// --- Component: ModernModal (ปรับปรุงการออกแบบปุ่มและสี) ---
const ModernModal = ({
  isOpen,
  onClose,
  title,
  children,
  type = "info", // ประเภทของ Modal: 'info', 'success', 'warning', 'error'
  primaryButtonText,
  onPrimaryButtonClick,
  secondaryButtonText,
  onSecondaryButtonClick,
  // เพิ่ม prop สำหรับควบคุมสถานะ Loading ของปุ่มหลัก
  isPrimaryButtonLoading = false,
}) => {
  const modalRef = useRef(null);

  // Effect สำหรับการปิด Modal ด้วย Escape Key และ Click Outside
  useEffect(() => {
    // ... (โค้ดเดิม)
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // กำหนด Icon, สีข้อความ Title, สีปุ่มหลัก และสีขอบบนของ Modal ตาม 'type'
  let iconComponent;
  let titleColor;
  let primaryButtonClass = "";
  let modalBorderColor = "";

  switch (type) {
    case "success":
      iconComponent = <CheckCircle className="w-8 h-8 text-green-500" />;
      titleColor = "text-green-700";
      // ปรับปรุงปุ่มหลักให้เป็นสี Blue 600 (เป็น Standard Action)
      primaryButtonClass =
        "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300 disabled:bg-blue-400";
      modalBorderColor = "border-t-4 border-green-400"; // เส้นขอบสีเขียว
      break;
    case "warning":
      iconComponent = <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      titleColor = "text-yellow-700";
      // ปรับปรุงปุ่มหลักให้เป็นสี Blue 600
      primaryButtonClass =
        "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300 disabled:bg-blue-400";
      modalBorderColor = "border-t-4 border-yellow-400"; // เส้นขอบสีเหลือง
      break;
    case "error":
      iconComponent = <XCircle className="w-8 h-8 text-red-500" />;
      titleColor = "text-red-700";
      // ปรับปรุงปุ่มหลักให้เป็นสี Blue 600
      primaryButtonClass =
        "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300 disabled:bg-blue-400";
      modalBorderColor = "border-t-4 border-red-400"; // เส้นขอบสีแดง
      break;
    case "info":
    default:
      iconComponent = <Info className="w-8 h-8 text-blue-500" />;
      titleColor = "text-blue-700";
      // ปรับปรุงปุ่มหลักให้เป็นสี Blue 600
      primaryButtonClass =
        "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300 disabled:bg-blue-400";
      modalBorderColor = "border-t-4 border-blue-400"; // เส้นขอบสีน้ำเงิน
      break;
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out animate-fade-in-scale">
      <div
        ref={modalRef}
        className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 transform transition-all duration-300 ease-out animate-slide-in-up ${modalBorderColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 mb-4">
          <div className="flex items-center gap-3">
            {iconComponent}
            <h3 className={`text-xl font-extrabold ${titleColor}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full p-1 -mr-1 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        {/* ส่วนเนื้อหาของ Modal */}
        <div className="text-gray-700 leading-relaxed text-center mb-6 text-sm">
          {children}
        </div>
        {/* ส่วนปุ่ม Actions */}
        <div className="flex justify-end gap-3 mt-4">
          {secondaryButtonText && (
            // ปุ่มรอง: ปรับเป็น Outline Button
            <button
              onClick={onSecondaryButtonClick || onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
              disabled={isPrimaryButtonLoading} // ไม่ให้กดปุ่มรองขณะกำลังโหลด
            >
              {secondaryButtonText}
            </button>
          )}
          {primaryButtonText && (
            // ปุ่มหลัก: ปรับให้เป็นสี Blue 600 และมี Loading State
            <button
              onClick={onPrimaryButtonClick || onClose}
              className={`px-6 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center gap-2
              ${primaryButtonClass}`}
              disabled={isPrimaryButtonLoading}
            >
              {isPrimaryButtonLoading ? (
                // Loading Spinner
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              {primaryButtonText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- Component: SidebarAdmin (ปรับปรุงการออกแบบ Sidebar) ---
const SidebarAdmin = ({ profile, loading }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const token = useEcomStore((state) => state.token);
  const fetchProfile = useEcomStore((state) => state.fetchProfile);
  const logout = useEcomStore((state) => state.logout);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // handle file selection -> preview as base64
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ไม่เกิน 5MB (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      e.target.value = null; // เคลียร์ไฟล์ที่เลือก
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || !token) return alert("กรุณาเลือกภาพและล็อกอิน");
    try {
      setUploading(true);
      const res = await uploadProfilePicture(token, preview);
      console.log("[SidebarAdmin] uploadProfilePicture response", res?.data);
      await fetchProfile(); // refresh profile in store

      // Sync user.picture to the main 'user' object in the store (if applicable)
      try {
        const newProfile = useEcomStore.getState().profile;
        if (newProfile && newProfile.picture) {
          const currentUser = useEcomStore.getState().user;
          if (currentUser) {
            useEcomStore.setState({
              user: { ...currentUser, picture: newProfile.picture },
            });
          }
        }
      } catch (e) {
        console.error("[SidebarAdmin] failed to sync user.picture", e);
      }
      setIsUploadModalOpen(false);
      setPreview(null);
      alert("อัปโหลดรูปโปรไฟล์สำเร็จ");
    } catch (err) {
      console.error(err);
      alert("อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    localStorage.removeItem("token");
    navigate("/");
    setIsLogoutModalOpen(false);
  };

  // Class CSS พื้นฐานสำหรับ NavLink (ปรับปรุงเล็กน้อย)
  const baseNavLinkClass =
    "flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all duration-200 select-none group focus:outline-none focus:ring-2 focus:ring-blue-100";
  // Class CSS สำหรับ NavLink ที่ Active / Inactive (ปรับปรุงให้ดู Premium)
  const activeNavLinkClass =
    "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 shadow-md scale-[1.01] ring-1 ring-blue-200 border border-yellow-300";
  const inactiveNavLinkClass =
    "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // รายการ Menu (เหมือนเดิม)
  const menuItems = [
    {
      to: "/admin",
      icon: (
        <LayoutGrid className="w-6 h-6 group-hover:text-yellow-500 transition" />
      ),
      label: "แดชบอร์ด",
    },
    {
      to: "manage",
      icon: (
        <Users2 className="w-6 h-6 group-hover:text-yellow-500 transition" />
      ),
      label: "จัดการผู้ใช้",
    },
    {
      to: "reviews",
      icon: <Star className="w-6 h-6 group-hover:text-yellow-500 transition" />,
      label: "จัดการรีวิว",
    },
    {
      to: "return-requests",
      icon: (
        <RotateCcw className="w-6 h-6 group-hover:text-yellow-500 transition" />
      ),
      label: "ร้องขอคืนสินค้า",
    },
    {
      to: "product",
      icon: (
        <PackagePlus className="w-6 h-6 group-hover:text-yellow-500 transition" />
      ),
      label: "สินค้า",
    },
  ];

  return (
    <>
      {/* ปุ่มเปิดปิด Sidebar สำหรับจอขนาดเล็ก */}
      <button
        className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-yellow-600 text-white shadow-lg md:hidden border border-blue-700 active:scale-95 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay สำหรับจอเล็ก */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar Component */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 ${SIDEBAR_BG} text-gray-900 flex flex-col shadow-2xl border-r border-gray-100
          transform transition-transform duration-300 ease-in-out z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex md:shadow-xl md:border-r-0
        `}
      >
        {/* Header ของ Sidebar: ปรับใช้สี Gradient ที่ดู Premium */}
        <div className="h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-between px-4 shadow-lg select-text cursor-default border-b border-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-700 font-extrabold text-xl shadow-inner">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">Admin Panel</span>
              <span className="text-xs text-blue-200">Commerce Control</span>
            </div>
          </div>
          <div className="hidden md:flex items-center text-xs text-blue-400 font-medium">
            v2.1
          </div>
        </div>

        {/* ส่วนแสดง Profile ผู้ใช้ */}
        <div className="flex flex-col items-center py-5 border-b border-gray-100 mb-3 bg-white">
          {loading ? (
            <div className="w-16 h-16 bg-gray-100 rounded-full animate-pulse mb-2" />
          ) : (
            <div className="relative mb-2">
              {/* Avatar Image / Placeholder */}
              {profile?.picture ? (
                <img
                  src={profile.picture}
                  alt="admin avatar"
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-xl ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-xl ring-2 ring-gray-100">
                  <UserRound className="w-8 h-8 text-gray-400" />
                </div>
              )}
              {/* Upload Button Overlay */}
              <button
                onClick={() => setIsUploadModalOpen(true)}
                title="อัปโหลดรูปโปรไฟล์"
                className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-lg border border-gray-200 hover:bg-blue-50 transition active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-yellow-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
              {/* Online Status Dot */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
          )}
          <div className="flex flex-col items-center text-center">
            <span className="font-bold text-base text-gray-900 leading-tight">
              {profile?.name || "Admin"}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-0.5 rounded-full mt-1 font-mono">
              {profile?.email || "admin@example.com"}
            </span>
          </div>
        </div>

        {/* Upload Modal (ใช้ ModernModal) */}
        <ModernModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setPreview(null);
          }}
          title="อัปโหลดรูปโปรไฟล์"
          type="info"
          primaryButtonText={uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
          onPrimaryButtonClick={handleUpload}
          secondaryButtonText="ยกเลิก"
          isPrimaryButtonLoading={uploading}
        >
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-br from-gray-50 to-white border-4 border-gray-100 shadow-md flex items-center justify-center">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : profile?.picture ? (
                <img
                  src={profile.picture}
                  alt="current"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserRound className="w-16 h-16 text-gray-300" />
              )}
            </div>
            <label className="px-4 py-2 bg-yellow-600 text-white rounded-lg cursor-pointer hover:bg-yellow-700 transition inline-flex items-center gap-2 font-medium shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              เลือกรูปใหม่
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <div className="text-sm text-gray-500 mt-1">
              ขนาดไฟล์สูงสุด: 5MB (JPG/PNG)
            </div>
          </div>
        </ModernModal>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto custom-scrollbar">
          {/* Section: ระบบหลัก */}
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-2 border-l-4 border-blue-400">
              ระบบหลัก
            </div>
            {menuItems
              .filter(({ to }) => to !== "product") // แยก 'product' ออก
              .map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/admin"}
                  title={label}
                  className={({ isActive }) =>
                    [
                      baseNavLinkClass,
                      isActive ? activeNavLinkClass : inactiveNavLinkClass,
                    ].join(" ")
                  }
                >
                  {icon}
                  <span className="tracking-wide">{label}</span>
                </NavLink>
              ))}
          </div>

          {/* Section: สินค้าและหมวดหมู่ */}
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-2 border-l-4 border-green-400">
              สินค้าและออเดอร์
            </div>
            {/* Link สินค้า (นอก Dropdown) */}
            <NavLink
              to="product"
              title="สินค้า"
              className={({ isActive }) =>
                [
                  baseNavLinkClass,
                  isActive ? activeNavLinkClass : inactiveNavLinkClass,
                ].join(" ")
              }
            >
              <PackagePlus className="w-6 h-6 group-hover:text-yellow-500 transition" />
              <span className="tracking-wide">จัดการสินค้า</span>
            </NavLink>

            {/* Dropdown หมวดหมู่สินค้า */}
            <div className="relative select-none mt-2">
              <button
                type="button"
                className={[
                  baseNavLinkClass,
                  "w-full flex justify-between items-center text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  categoryDropdownOpen
                    ? "bg-gray-100 text-gray-900 shadow-sm scale-[1.01] ring-1 ring-gray-200"
                    : "",
                ].join(" ")}
                onClick={() => setCategoryDropdownOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={categoryDropdownOpen}
              >
                <span className="flex items-center gap-3">
                  <Layers3 className="w-6 h-6 group-hover:text-yellow-500 transition" />
                  <span className="tracking-wide">หมวดหมู่สินค้า</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform ${
                    categoryDropdownOpen
                      ? "rotate-180 text-yellow-600"
                      : "rotate-0"
                  }`}
                />
              </button>
              {categoryDropdownOpen && (
                <div className="mt-1 ml-4 border-l-2 border-gray-200 py-1 space-y-1 animate-fade-in-scale">
                  <NavLink
                    to="/admin/category"
                    className={({ isActive }) =>
                      [
                        "block px-5 py-2 text-sm transition-all rounded-r-lg",
                        isActive
                          ? "bg-blue-100 text-yellow-600 font-semibold"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                      ].join(" ")
                    }
                    onClick={() => setCategoryDropdownOpen(false)}
                  >
                    จัดการหมวดหมู่หลัก
                  </NavLink>
                  <NavLink
                    to="/admin/category/sub"
                    className={({ isActive }) =>
                      [
                        "block px-5 py-2 text-sm transition-all rounded-r-lg",
                        isActive
                          ? "bg-blue-100 text-yellow-600 font-semibold"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                      ].join(" ")
                    }
                    onClick={() => setCategoryDropdownOpen(false)}
                  >
                    เพิ่ม/แก้ไข ประเภทย่อย
                  </NavLink>
                  <NavLink
                    to="/admin/category/subsub"
                    className={({ isActive }) =>
                      [
                        "block px-5 py-2 text-sm transition-all rounded-r-lg",
                        isActive
                          ? "bg-blue-100 text-yellow-600 font-semibold"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                      ].join(" ")
                    }
                    onClick={() => setCategoryDropdownOpen(false)}
                  >
                    เพิ่ม/แก้ไข ย่อย-ประเภทย่อย
                  </NavLink>
                </div>
              )}
            </div>

            {/* Link ออเดอร์ */}
            <NavLink
              key="orders"
              to="orders"
              title="ออเดอร์"
              className={({ isActive }) =>
                [
                  baseNavLinkClass,
                  isActive ? activeNavLinkClass : inactiveNavLinkClass,
                ].join(" ")
              }
            >
              <ReceiptText className="w-6 h-6 group-hover:text-yellow-500 transition" />
              <span className="tracking-wide">ออเดอร์</span>
            </NavLink>
          </div>
        </nav>

        {/* ปุ่ม Logout */}
        <div className="mb-6 px-4">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl font-bold shadow-md hover:bg-red-100 transition-all duration-200 active:scale-[0.98] border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
            aria-label="Logout"
            title="Logout"
            type="button"
          >
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Modal สำหรับยืนยันการออกจากระบบ (ใช้ ModernModal ที่ปรับปรุงใหม่) */}
      <ModernModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="ยืนยันการออกจากระบบ"
        type="warning" // Warning type
        primaryButtonText="ยืนยัน"
        onPrimaryButtonClick={handleLogoutConfirm}
        secondaryButtonText="ยกเลิก"
      >
        <p className="text-center text-gray-700">
          คุณต้องการออกจากระบบ **Admin Panel** ใช่หรือไม่?
          <br />
          การกระทำนี้จะสิ้นสุดเซสชันปัจจุบันของคุณ
          <br />
          <span className="text-red-500 font-semibold mt-2 block">
            โปรดตรวจสอบให้แน่ใจว่าคุณได้บันทึกการเปลี่ยนแปลงใด ๆ ที่ทำไว้
          </span>
        </p>
      </ModernModal>
    </>
  );
};

export default SidebarAdmin;
