import React, { useEffect, useState } from "react";
import useEcomStore from "../store/ecom-store";
import { currentUser } from "../api/auth";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteUser = ({ element }) => {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useEcomStore((state) => state.user);
  const token = useEcomStore((state) => state.token);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      // If user/token aren't present yet, skip and mark loading finished
      if (!user || !token) {
        if (mounted) {
          setOk(false);
          setLoading(false);
        }
        return;
      }

      try {
        await currentUser(token);
        if (mounted) setOk(true);
      } catch {
        if (mounted) setOk(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-700 bg-gray-50">
        <p>กำลังตรวจสอบข้อมูลผู้ใช้...</p>
      </div>
    );
  }

  return ok ? element : <LoadingToRedirect />;
};

export default ProtectRouteUser;
