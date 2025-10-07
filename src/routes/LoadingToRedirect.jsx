import React, { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
// ไอคอนสำหรับแจ้งเตือน (ต้องติดตั้ง heroicons: npm install @heroicons/react หรือเทียบเท่า)
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

/**
 * คอมโพเนนต์แสดงหน้าจอ Loading พร้อมนับถอยหลังก่อนเปลี่ยนเส้นทาง
 * ใช้เมื่อผู้ใช้ไม่มีสิทธิ์เข้าถึงหน้าใดหน้าหนึ่ง
 *
 * @param {object} props - คุณสมบัติของคอมโพเนนต์
 * @param {string} props.path - เส้นทางที่จะเปลี่ยนไปเมื่อนับถอยหลังเสร็จสิ้น (ค่าเริ่มต้นคือ "/")
 * @param {number} props.initialCount - จำนวนวินาทีเริ่มต้นในการนับถอยหลัง (ค่าเริ่มต้นคือ 3)
 */
const LoadingToRedirect = ({ path = "/", initialCount = 3 }) => {
  // สถานะสำหรับการนับถอยหลัง
  const [count, setCount] = useState(initialCount);
  // ใช้ useRef เพื่อเก็บ Timer ID
  const timerId = useRef(null);

  useEffect(() => {
    // กำหนด Timer ให้ทำงานทุก 1,000 มิลลิวินาที (1 วินาที)
    timerId.current = setInterval(() => {
      setCount((prevCount) => {
        // ลดค่าลง 1 วินาที
        const newCount = prevCount - 1;

        // หากถึง 0 หรือต่ำกว่า ให้ล้าง Timer
        if (newCount <= 0) {
          clearInterval(timerId.current);
          return 0;
        }

        return newCount;
      });
    }, 1000);

    // Cleanup function: ล้าง Timer เมื่อคอมโพเนนต์ถูกถอดออก (Unmount)
    return () => clearInterval(timerId.current);
  }, []); // รัน Effect ครั้งเดียวเมื่อคอมโพเนนต์ถูก Mount

  // หาก count ถึง 0 ให้ทำการเปลี่ยนเส้นทาง
  if (count === 0) {
    return <Navigate to={path} replace />;
  }

  // --- การแสดงผล (Rendering) ---
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 border-t-4 border-red-500 transition-all duration-300 transform hover:scale-[1.01]">
        {/* Header และ Icon */}
        <div className="flex items-center space-x-4 mb-6">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          <h2 className="text-3xl font-extrabold text-gray-800">
            Access Denied
          </h2>
        </div>

        {/* ข้อความแจ้งเตือน */}
        <p className="text-lg text-gray-600 mb-6">
          ขออภัย, คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          โปรดติดต่อผู้ดูแลระบบหากเชื่อว่านี่คือข้อผิดพลาด
        </p>

        {/* Counter และ Animation */}
        <div className="text-center">
          <p className="text-xl text-gray-700">
            ระบบจะนำคุณกลับไปหน้าหลักใน...
          </p>
          <div className="mt-4 inline-block bg-red-100 p-3 rounded-full shadow-inner">
            <span className="text-5xl font-mono font-bold text-red-600 transition-all duration-500 animate-pulse">
              {count}
            </span>
          </div>
          <p className="text-base text-gray-500 mt-2">วินาที</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingToRedirect;
