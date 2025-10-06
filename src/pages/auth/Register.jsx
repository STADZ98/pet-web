import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import zxcvbn from "zxcvbn";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  RotateCcwKey,
  KeyRound,
  UserPlus,
} from "lucide-react";

const registerSchema = z
  .object({
    email: z.string().email({ message: "อีเมลไม่ถูกต้อง!" }),
    password: z
      .string()
      .min(8, { message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" })
      .regex(/[A-Z]/, "ต้องมีตัวอักษรพิมพ์ใหญ่")
      .regex(/[a-z]/, "ต้องมีตัวอักษรพิมพ์เล็ก")
      .regex(/[0-9]/, "ต้องมีตัวเลข")
      .regex(/[@$!%*?&]/, "ต้องมีอักขระพิเศษ เช่น @$!%*?&"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const API = import.meta.env.VITE_API || "/api";
      await axios.post(`${API}/register`, data);
      toast.success("สมัครสมาชิกสำเร็จ!");
      navigate("/login");
    } catch (err) {
      const errMsg = err.response?.data?.message || "เกิดข้อผิดพลาด";
      toast.error(errMsg);
    }
  };

  const passwordValue = watch("password");
  useEffect(() => {
    const pwd = passwordValue || "";
    const result = zxcvbn(pwd);
    setPasswordScore(result.score);

    if (!pwd) setPasswordFeedback("");
    else if (result.score === 0) setPasswordFeedback("รหัสผ่านอ่อนมาก");
    else if (result.score === 1) setPasswordFeedback("รหัสผ่านอ่อน");
    else if (result.score === 2) setPasswordFeedback("รหัสผ่านพอใช้ได้");
    else if (result.score === 3) setPasswordFeedback("รหัสผ่านแข็งแรง");
    else setPasswordFeedback("รหัสผ่านปลอดภัยมาก");
  }, [passwordValue]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="relative w-full max-w-md bg-white p-8 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-[1.01] animate-fade-in">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <UserPlus size={40} />
        </div>

        <h1 className="text-3xl font-extrabold text-center text-gray-800 mt-8 mb-2">
          สร้างบัญชีใหม่
        </h1>
        <p className="text-center text-gray-500 mb-6">
          ยินดีต้อนรับ! กรุณากรอกข้อมูลเพื่อสมัครสมาชิก
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition" />
            <input
              {...register("email")}
              placeholder="อีเมล"
              className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${
                errors.email && "border-red-500"
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="relative group">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="รหัสผ่าน"
              className={`w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${
                errors.password && "border-red-500"
              }`}
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 cursor-pointer hover:text-blue-600 transition"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}

            {passwordValue?.length > 0 && (
              <>
                <div className="flex mt-2 space-x-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                        passwordScore > index
                          ? passwordScore < 2
                            ? "bg-red-500"
                            : passwordScore < 4
                            ? "bg-yellow-400"
                            : "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    ></div>
                  ))}
                </div>
                <p
                  className={`text-sm mt-1 font-medium ${
                    passwordScore < 2
                      ? "text-red-500"
                      : passwordScore < 4
                      ? "text-yellow-500"
                      : "text-green-600"
                  }`}
                >
                  {passwordFeedback}
                </p>
              </>
            )}
          </div>

          <div className="relative group">
            <RotateCcwKey className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition" />
            <input
              {...register("confirmPassword")}
              type="password"
              placeholder="ยืนยันรหัสผ่าน"
              className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition ${
                errors.confirmPassword && "border-red-500"
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 font-bold text-lg rounded-lg transition-all duration-300 active:scale-95 shadow-md ${
              isSubmitting
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-lg"
            }`}
          >
            {isSubmitting ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium hover:text-blue-800 transition"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fadeIn 0.8s ease-out; }
        `}
      </style>
    </div>
  );
};

export default Register;
