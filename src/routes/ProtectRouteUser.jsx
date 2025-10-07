import React, { useEffect, useState } from "react";
import useEcomStore from "../store/ecom-store";
import { currentUser } from "../api/auth";
import LoadingToRedirect from "./LoadingToRedirect";

// ----------------------------------------------------------------------
// Custom Hook: ใช้สำหรับจัดการ Logic การตรวจสอบสิทธิ์ (Auth Check)
// ----------------------------------------------------------------------

/**
 * Custom Hook สำหรับตรวจสอบสถานะการเป็นผู้ใช้ (User) และสิทธิ์การเข้าถึง
 * @returns {object} { ok, loading }
 */
const useAuthCheck = () => {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  // ดึง user และ token จาก store
  const user = useEcomStore((state) => state.user);
  const token = useEcomStore((state) => state.token);

  useEffect(() => {
    // ใช้ AbortController เพื่อจัดการการยกเลิก API call เมื่อ Component ถูก Unmount
    const controller = new AbortController();
    const signal = controller.signal;

    const verify = async () => {
      // 1. ตรวจสอบว่ามีข้อมูลพื้นฐานหรือไม่
      if (!user || !token) {
        setOk(false);
        setLoading(false);
        return;
      }

      // 2. มี user/token -> ตรวจสอบกับ Backend
      try {
        await currentUser(token, { signal });
        setOk(true);
      } catch (error) {
        // หากเกิด Error และไม่ใช่ Abort Error (เช่น Authentication Failed)
        if (error.name !== "AbortError") {
          setOk(false);
        }
      } finally {
        // ตรวจสอบว่า Effect ยังไม่ถูกยกเลิก (ยังไม่ได้ Unmount)
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    verify();

    // Cleanup function: ยกเลิก API call เมื่อ Component ถูก Unmount
    return () => {
      controller.abort();
    };
    // ใช้ !!user และ !!token ใน Dependency array เพื่อความชัดเจนว่าเป็น Boolean
  }, [!!user, !!token]);

  return { ok, loading };
};

// ----------------------------------------------------------------------
// Component หลัก: ProtectRouteUser
// ----------------------------------------------------------------------

/**
 * คอมโพเนนต์สำหรับป้องกันเส้นทาง (Route Protection) สำหรับผู้ใช้ทั่วไป (User)
 * จะแสดง 'element' ที่กำหนด หากผู้ใช้ผ่านการตรวจสอบสิทธิ์
 * @param {object} props
 * @param {React.ReactNode} props.element - คอมโพเนนต์ที่จะแสดงเมื่อผู้ใช้มีสิทธิ์เข้าถึง
 */
const ProtectRouteUser = ({ element }) => {
  // ดึงสถานะการตรวจสอบสิทธิ์จาก Custom Hook ที่สร้างไว้ภายในไฟล์
  const { ok, loading } = useAuthCheck();

  // --- 1. สถานะ Loading ---
  // แสดงหน้าจอ Loading ขณะที่กำลังตรวจสอบ
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <p className="text-xl font-semibold text-gray-700 animate-pulse">
          กำลังตรวจสอบข้อมูลผู้ใช้...
        </p>
      </div>
    );
  }

  // --- 2. การตัดสินใจ ---
  // ถ้า 'ok' เป็นจริง ให้แสดง element
  // ถ้า 'ok' เป็นเท็จ ให้ Redirect ไปหน้าอื่น
  return ok ? element : <LoadingToRedirect />;
};

export default ProtectRouteUser;
