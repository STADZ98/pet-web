import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const LoadingToRedirect = () => {
  const [count, setCount] = useState(3);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c <= 0.5) {
          clearInterval(interval);
          setRedirect(true);
          return 0;
        }
        return parseFloat((c - 0.5).toFixed(1));
      });
    }, 500); // ลดทีละ 0.5 วินาที

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
