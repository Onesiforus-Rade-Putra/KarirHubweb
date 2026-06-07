import React, { useState } from "react";
import { UserRole } from "../../types";
import { Briefcase, Store, UserCheck, Eye, EyeOff } from "lucide-react";
import { loginUser, registerUser } from "../../lib/authApi";

interface AuthProps {
  mode: "login" | "daftar";
  onAuthSuccess: (role: UserRole, userDetails: any) => void;
  onSwitchMode: (mode: "login" | "daftar") => void;
}

export const Auth: React.FC<AuthProps> = ({ mode, onAuthSuccess, onSwitchMode }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("seeker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email dan Password wajib diisi!");
      return;
    }

    if (mode === "daftar") {
      if (!name) {
        setError("Nama Lengkap wajib diisi!");
        return;
      }
      if (password.length < 8) {
        setError("Password minimal harus 8 karakter!");
        return;
      }
      if (password !== confirmPassword) {
        setError("Konfirmasi password tidak cocok!");
        return;
      }
    }

    try {
      setLoading(true);

      const result = mode === "daftar"
        ? await registerUser({ name, email, password, role: selectedRole })
        : await loginUser({ email, password, role: selectedRole });

      onAuthSuccess(result.user.role, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Autentikasi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialClick = (provider: string) => {
    setError(`Login ${provider} belum diaktifkan di backend. Gunakan email dan password dulu.`);
  };

  return (
    <div className="max-w-[620px] w-full mx-auto my-12 px-4 flex flex-col justify-center">
      {/* Centered Brand Logo Block above and outside the White Card */}
      <div className="text-center mb-8">
        <div 
          className="flex items-center justify-center gap-2 mb-4 cursor-pointer" 
          onClick={() => onSwitchMode("login")}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600 fill-current">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
          </svg>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">KarirHub</span>
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-3">
          {mode === "login" ? "Selamat Datang Kembali" : "Mulai Perjalanan Karirmu"}
        </h2>
        
        <p className="text-sm text-slate-500 font-medium">
          {mode === "login" ? "Pilih role dan masuk untuk melanjutkan" : "Pilih role dan daftar untuk memulai"}
        </p>
      </div>

      {/* Styled Central Card Form Container */}
      <div className="w-full bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 sm:p-10">
        
        {/* Role Cards Selector */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-slate-700 block mb-3 text-left">
            {mode === "login" ? "Masuk Sebagai" : "Daftar Sebagai"}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {/* Job Seeker Option */}
            <button
              type="button"
              onClick={() => setSelectedRole("seeker")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 text-center cursor-pointer ${
                selectedRole === "seeker"
                  ? "border-blue-600 bg-blue-50/15 ring-1 ring-blue-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-500 bg-white"
              }`}
            >
              <Briefcase className={`w-6 h-6 mb-2.5 ${selectedRole === "seeker" ? "text-blue-600" : "text-slate-400"}`} />
              <span className="text-xs font-bold text-slate-900 block leading-tight">Job Seeker</span>
              <span className="text-[10px] text-slate-405 mt-1 leading-tight">Saya mencari pekerjaan</span>
            </button>

            {/* Seller Option */}
            <button
              type="button"
              onClick={() => setSelectedRole("seller")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 text-center cursor-pointer ${
                selectedRole === "seller"
                  ? "border-purple-600 bg-purple-50/15 ring-1 ring-purple-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-500 bg-white"
              }`}
            >
              <Store className={`w-6 h-6 mb-2.5 ${selectedRole === "seller" ? "text-purple-600" : "text-slate-400"}`} />
              <span className="text-xs font-bold text-slate-900 block leading-tight">Seller</span>
              <span className="text-[10px] text-slate-405 mt-1 leading-tight">Saya menjual jasa karir</span>
            </button>

            {/* Recruiter Option */}
            <button
              type="button"
              onClick={() => setSelectedRole("recruiter")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 text-center cursor-pointer ${
                selectedRole === "recruiter"
                  ? "border-emerald-600 bg-emerald-50/15 ring-1 ring-emerald-600"
                  : "border-slate-200 hover:bg-slate-50 text-slate-500 bg-white"
              }`}
            >
              <UserCheck className={`w-6 h-6 mb-2.5 ${selectedRole === "recruiter" ? "text-emerald-600" : "text-slate-400"}`} />
              <span className="text-xs font-bold text-slate-900 block leading-tight">Recruiter</span>
              <span className="text-[10px] text-slate-450 mt-1 leading-tight">Saya merekrut karyawan</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-xl text-left font-semibold">
            {error}
          </div>
        )}

        {/* Input Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === "daftar" && (
            <div className="text-left">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 placeholder-slate-400 text-slate-800 font-medium"
                required
              />
            </div>
          )}

          <div className="text-left">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 placeholder-slate-400 text-slate-800 font-medium"
              required
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={mode === "daftar" ? "Minimal 8 karakter" : "Masukkan password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 placeholder-slate-400 text-slate-800 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "daftar" && (
            <div className="text-left">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Konfirmasi Password
              </label>
              <input
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 placeholder-slate-400 text-slate-800 font-medium"
                required
              />
            </div>
          )}

          {/* Bottom Actions Row */}
          {mode === "login" ? (
            <div className="flex items-center justify-between text-sm mt-4">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none font-medium">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Lupa password?
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-left leading-relaxed mt-4 font-medium">
              Saya setuju dengan{" "}
              <span className="text-blue-600 font-bold cursor-pointer hover:underline">
                Syarat & Ketentuan
              </span>{" "}
              dan{" "}
              <span className="text-blue-600 font-bold cursor-pointer hover:underline">
                Kebijakan Privasi
              </span>
            </div>
          )}

          {/* Complete Submission CTA Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all duration-150 shadow-sm cursor-pointer mt-6"
          >
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        {/* Divider Bar */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-150"></div>
          </div>
          <span className="relative bg-white px-3 text-xs text-slate-400 font-bold uppercase tracking-wider">
            {mode === "login" ? "Atau lanjutkan dengan" : "Atau daftar dengan"}
          </span>
        </div>

        {/* Social Authentication Columns */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialClick("Google")}
            className="flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm py-2 px-4 rounded-xl transition cursor-pointer font-bold h-11"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285h11.45c.16 1.002.26 2.03.26 3.167 0 6.896-4.63 11.83-11.71 11.83-6.63 0-12-5.37-12-12s5.37-12 12-12c3.24 0 5.95 1.19 8.05 3.14l-3.26 3.26c-1.12-1.07-2.6-1.74-4.79-1.74-4.14 0-7.52 3.42-7.52 7.64s3.38 7.64 7.52 7.64c4.32 0 5.93-3.1 6.19-4.77h-6.19v-4.52z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialClick("Facebook")}
            className="flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm py-2 px-4 rounded-xl transition cursor-pointer font-bold h-11"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>
        </div>

        {/* Footer Toggle Switches Mode */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500 font-medium">
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              onClick={() => onSwitchMode(mode === "login" ? "daftar" : "login")}
              className="font-bold text-blue-600 hover:underline cursor-pointer ml-1"
            >
              {mode === "login" ? "Daftar sekarang" : "Masuk di sini"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
