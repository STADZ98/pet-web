import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const LoadingToRedirect = ({ user }) => {
  const [count, setCount] = useState(3);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") return; // ถ้าเป็น admin ไม่ต้อง redirect

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
  }, [user]);

  if (user?.role === "admin") {
    return <div>Welcome Admin</div>; // หรือ render admin page ของคุณ
  }

  if (redirect) {
    return <Navigate to="/" />;
  }

  return <div>No Permission. Redirecting in {count}...</div>;
};

export default LoadingToRedirect;
