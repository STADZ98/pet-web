import React from "react";

const Toasts = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={`max-w-sm w-full px-4 py-2 rounded-md shadow-md text-sm text-white ${
            t.type === "error"
              ? "bg-red-600"
              : t.type === "success"
              ? "bg-green-600"
              : "bg-slate-700"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>{t.message}</div>
            <button
              aria-label="close toast"
              className="ml-3 opacity-90"
              onClick={() => onRemove(t.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toasts;
