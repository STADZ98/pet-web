import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const LoadingToRedirect = ({ user, isLoading }) => {
  const [count, setCount] = useState(3);
  const [redirect, setRedirect] = useState(false);

  // ถ้าข้อมูลยังโหลดอยู่ รอ
  if (isLoading) {
    return <div>Loading user info...</div>;
  }

  // ถ้าเป็น admin ให้เข้า
  if (user?.role === "admin") {
    return <div>Welcome Admin!</div>; // หรือ render หน้า admin จริงๆ
  }

  // ถ้าไม่ใช่ admin ให้ redirect
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((currentCount) => {
        if (currentCount === 1) {
          clearInterval(interval);
          setRedirect(true);
        }
        return currentCount - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (redirect) return <Navigate to="/" />;

  return <div>No Permission. Redirecting in {count}...</div>;
};

export default LoadingToRedirect;
