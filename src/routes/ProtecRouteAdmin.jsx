import React, { useEffect, useState } from "react";
import useEcomStore from "../store/ecom-store";
import { currentAdmin } from "../api/auth";
import LoadingToRedirect from "./LoadingToRedirect"; // ตรวจสอบว่า "LoadingToRedirect" นำเข้าถูกต้อง

/**
 * คอมโพเนนต์สำหรับป้องกันเส้นทาง (Route) ที่เข้าถึงได้เฉพาะผู้ดูแลระบบ (Admin)
 * จะตรวจสอบสิทธิ์ของผู้ใช้ก่อนแสดงผลคอมโพเนนต์ที่ต้องการ
 *
 * @param {object} props - คุณสมบัติของคอมโพเนนต์
 * @param {React.ReactNode} props.element - คอมโพเนนต์ที่จะแสดงผลเมื่อผู้ใช้มีสิทธิ์ (Admin)
 */
const ProtectRouteAdmin = ({ element }) => {
  // สถานะสำหรับบ่งชี้ว่าผู้ใช้เป็น Admin และพร้อมที่จะแสดงผลเนื้อหาหรือไม่
  const [isAdmin, setIsAdmin] = useState(false);
  // สถานะสำหรับบ่งชี้ว่ากำลังตรวจสอบสิทธิ์อยู่หรือไม่
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลผู้ใช้ (user) และโทเค็น (token) จาก Global Store
  const { user, token } = useEcomStore((state) => ({
    user: state.user,
    token: state.token,
  }));

  useEffect(() => {
    // ฟังก์ชันตรวจสอบสิทธิ์ Admin
    const checkAdminPermission = async () => {
      // 1. ตรวจสอบว่ามี user และ token อยู่ใน Store หรือไม่
      if (user && token) {
        try {
          // 2. เรียก API เพื่อตรวจสอบสิทธิ์ Admin ด้วย token
          await currentAdmin(token);
          // 3. หากสำเร็จ กำหนดให้เป็น Admin
          setIsAdmin(true);
        } catch (error) {
          // 4. หากเกิดข้อผิดพลาด (เช่น ไม่ใช่ Admin หรือ token หมดอายุ)
          console.error("Admin permission check failed:", error);
          setIsAdmin(false);
        } finally {
          // 5. ไม่ว่าจะสำเร็จหรือไม่ ให้หยุดสถานะ Loading
          setIsLoading(false);
        }
      } else {
        // หากไม่มี user หรือ token ให้หยุด Loading ทันที และไม่ใช่ Admin
        setIsAdmin(false);
        setIsLoading(false);
      }
    };

    checkAdminPermission();
    // Dependency array: รัน Effect เมื่อ user หรือ token มีการเปลี่ยนแปลง
  }, [user, token]);

  // --- การแสดงผล (Rendering) ---

  // 1. กำลังตรวจสอบสิทธิ์
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-700 bg-gray-50">
        <p>กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
      </div>
    );
  }

  // 2. ตรวจสอบเสร็จสิ้น
  // หากเป็น Admin ให้แสดงคอมโพเนนต์ที่ต้องการ (element)
  // หากไม่เป็น Admin ให้เปลี่ยนเส้นทางไปยังหน้าอื่น (LoadingToRedirect)
  return isAdmin ? element : <LoadingToRedirect />;
};

export default ProtectRouteAdmin;
