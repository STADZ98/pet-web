import React, { useEffect, useState } from "react";
import useEcomStore from "../store/ecom-store";
import { currentAdmin } from "../api/auth";
import LoadingToRedirect from "./LoadingToRedirect";

const ProtectRouteAdmin = ({ element }) => {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useEcomStore((state) => state.user);
  const token = useEcomStore((state) => state.token);

  useEffect(() => {
    if (user && token) {
      currentAdmin(token)
        .then(() => setOk(true))
        .catch(() => setOk(false))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Checking permissions...
      </div>
    );
  }

  return ok ? element : <LoadingToRedirect />;
};

export default ProtectRouteAdmin;
