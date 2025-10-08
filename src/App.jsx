// App.jsx
// Component หลักของแอปนี้ ทำหน้าที่เป็น root ของทุก route และแสดง ToastContainer สำหรับแจ้งเตือน
import React, { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import useEcomStore from "./store/ecom-store";

// ฟังก์ชั่น App: bootstrap ข้อมูลหลักของแอป ก่อนแสดงหน้า
const App = () => {
  const [booted, setBooted] = useState(false);

  // store actions
  const getCategory = useEcomStore((s) => s.getCategory);
  const getSubcategories = useEcomStore((s) => s.getSubcategories);
  const getSubsubcategories = useEcomStore((s) => s.getSubsubcategories);
  const getBrands = useEcomStore((s) => s.getBrands);
  const getProduct = useEcomStore((s) => s.getProduct);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        // Load taxonomy + products in parallel; swallow individual failures
        await Promise.allSettled([
          getCategory?.(),
          getSubcategories?.(),
          getSubsubcategories?.(),
          getBrands?.(),
          // load a moderate number of products for initial UI
          getProduct?.("createdAt", "desc", 50),
        ]);
      } catch (err) {
        // shouldn't happen because we used allSettled, but log defensively
        console.error("Bootstrap error:", err);
      } finally {
        if (mounted) setBooted(true);
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
    // Intentionally only run once on mount. The store action references are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!booted) {
    // Simple fullscreen loader while bootstrapping
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 border-4 border-blue-300 rounded-full border-t-blue-600 animate-spin" />
          <div className="text-gray-600">
            กำลังเตรียมข้อมูลสำหรับเว็บไซต์...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <AppRoutes />
    </>
  );
};

export default App;
