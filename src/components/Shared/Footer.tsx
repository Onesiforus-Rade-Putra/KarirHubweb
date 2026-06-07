import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer id="app-footer" className="bg-white border-t border-slate-100 py-6 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            {/* KarirHub Icon */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600 fill-current">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">KarirHub</span>
        </div>

        {/* Copyright */}
        <div className="text-slate-400 text-center text-[11px]">
          © 2025 KarirHub. Hak Cipta Dilindungi.
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-slate-500">
          <span className="hover:text-blue-600 cursor-pointer transition">Ketentuan</span>
          <span className="hover:text-blue-600 cursor-pointer transition">Privasi</span>
          <span className="hover:text-blue-600 cursor-pointer transition">Bantuan</span>
        </div>
      </div>
    </footer>
  );
};
