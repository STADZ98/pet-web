import React from "react";

const FullPageSpinner = ({ message = "กำลังโหลด..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="inline-flex flex-col items-center gap-4 bg-white/95 dark:bg-gray-800/95 rounded-xl p-6 shadow-lg">
        <svg
          className="animate-spin h-12 w-12 text-orange-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <div className="text-gray-700 font-medium">{message}</div>
      </div>
    </div>
  );
};

export default FullPageSpinner;
