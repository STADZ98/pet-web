import React, { useState } from "react";
import { toast } from "react-toastify";
import useEcomStore from "../../store/ecom-store";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();
  const actionLogin = useEcomStore((state) => state.actionLogin);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await actionLogin(form);
      const role = res.data.payload.role;
      roleRedirect(role);
      // toast.success("ยินดีต้อนรับเข้าสู่ระบบ!");
    } catch (err) {
      const errMsg =
        err.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const roleRedirect = (role) => {
    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md animate-fadeIn">
        {/* Title */}
        <h1 className="text-3xl font-extrabold text-center text-blue-700 mb-2 mt-6 drop-shadow">
          เข้าสู่ระบบ
        </h1>
        <p className="text-center text-gray-500 mb-6">ยินดีต้อนรับกลับมา 👋</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="flex items-center group bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-400 focus-within:shadow-sm transition">
            <FiMail
              className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition mr-3"
              aria-hidden="true"
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleOnChange}
              required
              placeholder="อีเมล"
              className="flex-1 pr-4 bg-transparent text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>

          {/* Password Field */}
          <div className="flex items-center group bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-400 focus-within:shadow-sm transition">
            <FiLock
              className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition mr-3"
              aria-hidden="true"
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleOnChange}
              required
              placeholder="รหัสผ่าน"
              className="flex-1 pr-3 bg-transparent text-slate-700 placeholder-slate-400 outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              onClick={() => setShowPassword((s) => !s)}
              className="ml-2 p-1 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {showPassword ? (
                // eye-off icon (simple svg)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.02.153-2.004.442-2.93M3 3l18 18"
                  />
                </svg>
              ) : (
                // eye icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-right text-sm">
            <a
              href="#"
              className="text-blue-500 hover:underline hover:text-blue-700 transition"
            >
              ลืมรหัสผ่าน?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md font-semibold shadow-md transition-all duration-200 active:scale-95 ${
              loading
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:scale-105 hover:shadow-lg"
            }`}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-6 text-gray-600">
          ยังไม่มีบัญชี?{" "}
          <Link
            to="/register"
            className="text-blue-600 hover:underline hover:text-blue-800 transition"
          >
            สมัครสมาชิก
          </Link>
        </p>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .animate-fadeIn { animation: fadeIn 0.7s cubic-bezier(.4,2,.6,1) }
          
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0);}
            50% { transform: translateY(-10px);}
          }
          .animate-bounce-slow { animation: bounce-slow 2.5s infinite; }
        `}
      </style>
    </div>
  );
};

export default Login;
