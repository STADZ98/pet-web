import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const LoadingToRedirect = ({ user, isLoading }) => {
  const [count, setCount] = useState(3); // เริ่มที่ 3 วินาที
  const [redirect, setRedirect] = useState(false);

  // รอข้อมูลผู้ใช้โหลด
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Loading user info...
      </div>
    );
  }

  // ถ้าเป็น admin ให้เข้า
  if (user?.role === "admin") {
    return <div>Welcome Admin!</div>;
  }

  // ถ้าไม่ใช่ admin ให้ redirect
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((currentCount) => {
        if (currentCount <= 0.5) {
          clearInterval(interval);
          setRedirect(true);
          return 0;
        }
        return parseFloat((currentCount - 0.5).toFixed(1)); // ลดทีละ 0.5 และปัดทศนิยม
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (redirect) return <Navigate to="/" />;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="text-red-600 text-2xl font-bold mb-4 animate-pulse">
        No Permission
      </div>
      <div className="text-gray-700 text-xl">
        Redirecting in{" "}
        <span className="text-blue-500 font-semibold text-3xl animate-bounce">
          {count}
        </span>{" "}
        seconds...
      </div>
    </div>
  );
};

export default LoadingToRedirect;
