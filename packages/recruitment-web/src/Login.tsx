import React, { useState } from "react";

// Định nghĩa đầy đủ kiểu dữ liệu nhận vào (Props) cho Login component
interface LoginProps {
  onLogoClick: () => void;
  onSignUpClick: () => void; // Cổng kết nối điều hướng sang trang Đăng ký
}

export default function Login({ onLogoClick, onSignUpClick }: LoginProps) {
  // --- State quản lý Form ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Hàm xử lý ẩn/hiện mật khẩu ---
  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // --- Hàm xử lý khi submit Form ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Xử lý đăng nhập với:", { email, password, rememberMe });
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden bg-[#FAF8F5] text-[#1C1917] font-['IBM_Plex_Sans'] antialiased">
      <main className="w-full max-w-[1440px] h-screen flex flex-col md:flex-row shadow-2xl bg-white">
        
        {/* CỘT TRÁI: Thương hiệu & Hình ảnh minh họa */}
        <section className="hidden md:flex md:w-[60%] h-full bg-[#FAF8F5] relative flex-col p-8 overflow-hidden border-r border-[rgba(214,206,196,0.6)]">
          {/* Lớp phủ họa tiết geometric pattern */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.15]" 
            style={{
              backgroundColor: "#FAF8F5",
              backgroundImage: "radial-gradient(#0D9488 0.5px, transparent 0.5px)",
              backgroundSize: "24px 24px",
            }}
          ></div>
          
          <div className="relative z-10 flex flex-col h-full">
            {/* Thông tin Header */}
            <div className="mb-auto">
              <h1 className="text-3xl text-[#1C1917] mb-4 max-w-xl font-semibold leading-tight">
                Recruitment Workflow Management System
              </h1>
              <p className="text-lg text-[#57534E] max-w-md">
                Streamline hiring decisions. Track every step. A unified platform for enterprise talent acquisition.
              </p>
            </div>

            {/* Hình ảnh minh họa trung tâm */}
            <div className="flex-grow flex items-center justify-center py-8">
              <div className="w-full max-w-2xl transform hover:scale-[1.02] transition-transform duration-700 ease-out">
                <img 
                  alt="Workflow Illustration" 
                  className="w-full h-auto drop-shadow-sm" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpBTBbhUGzc3jsdiHn5uQ8SUu4dfQWvltqWhgUoFsR9Pyc9eCCG19MS47PX7k0ElDn_-qIMk8u6ERwQyK_zse4Ak56a1odBnbuFSOKN5GLk2L9KZvBm7vAovoGdRzgeSXTioj6dWlND4mR_T9X6c2xOJ4FGC6SjIYWyXSj4uQB7RlXIhb8E5x8CrNeH641nt_8kRvRYnJL9pHUZuSgyOtGOmWt3F077sNBpihsEgsaoExgGLXUF5uUEOFNYhac5_towyQs0-SbONE"
                />
              </div>
            </div>

            {/* Đối tác tin cậy (Footer cột trái) */}
            <div className="mt-auto space-y-6">
              <p className="text-xs text-[#57534E] uppercase tracking-wider font-medium">
                Trusted by leading Vietnamese enterprises
              </p>
              <div className="opacity-80">
                <img 
                  alt="Partner Logos" 
                  className="h-12 w-auto object-contain" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT4x19rHrOIVlVSmgEM1h4TOuQmrmErI7KHZ1Rw9izMHp8uqPMO_bNatVlxS0fpt0ANdtVw8P6Jqs5kyoCpVPftuA9r8JWQEfTPVVIcjFxkDmX7KAYYBOiSujO-s3y9iU6UZMw9oSgwLfsSo3zt3Vxn0QYDBbGYYxLst1FoUe6Z4n7rkbug7IfTbH0hp1ZeBRFAcHhU8hltldPXBuWkEwKWzFJQuLyOy5XwUeaqL8WqHJkcqRHI1puqUZfvPEjNHCIMVnTLQnhwXk"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CỘT PHẢI: Form Đăng Nhập */}
        <section className="w-full md:w-[40%] h-full bg-white flex items-center justify-center p-6 relative">
          <div className="w-full max-w-[400px] flex flex-col items-center">
            
            {/* Logo Thương hiệu & Tiêu đề chào mừng */}
            <div className="text-center mb-8 w-full">
              <div className="flex items-center justify-center gap-2 mb-6">
                <span 
                  onClick={onLogoClick}
                  className="text-2xl text-[#0D9488] font-extrabold tracking-tighter cursor-pointer select-none transition-transform active:scale-95"
                >
                  RMS
                </span>
              </div>
              <h2 className="text-2xl text-[#1C1917] mb-1 font-semibold">Welcome back</h2>
              <p className="text-base text-[#57534E]">Sign in to your account</p>
            </div>

            {/* Form cấu trúc React */}
            <form className="w-full space-y-4" onSubmit={handleSubmit}>
              
              {/* Trường Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#57534E] block" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <input 
                    className="w-full h-12 px-4 bg-white border border-[rgba(214,206,196,0.6)] rounded-xl text-base text-[#1C1917] focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-all placeholder:text-[#57534E]/40" 
                    id="email" 
                    type="email"
                    placeholder="your.name@company.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Trường Mật khẩu */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#57534E] block" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <input 
                    className="w-full h-12 px-4 bg-white border border-[rgba(214,206,196,0.6)] rounded-xl text-base text-[#1C1917] focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] outline-none transition-all placeholder:text-[#57534E]/40" 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#57534E] hover:text-[#0D9488] transition-colors active:opacity-60" 
                    onClick={togglePassword} 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px] select-none">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Hàng tùy chọn Remember me & Forgot password */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <div className="relative flex items-center">
                    <input 
                      className="h-5 w-5 rounded border-[rgba(214,206,196,0.6)] text-[#0D9488] focus:ring-[#0D9488] transition-all cursor-pointer" 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                  </div>
                  <span className="text-sm font-medium text-[#57534E] group-hover:text-[#1C1917] transition-colors">
                    Remember me
                  </span>
                </label>
                <a className="text-sm text-[#0D9488] hover:underline font-semibold transition-all" href="#forgot-password">
                  Forgot password?
                </a>
              </div>

              {/* Nút Đăng nhập hệ thống */}
              <button 
                className="w-full h-12 bg-[#0D9488] text-white text-sm font-medium rounded-xl hover:bg-[#00685f] transition-all active:scale-[0.98] active:opacity-80 shadow-sm flex items-center justify-center gap-2 mt-4" 
                type="submit"
              >
                Sign In
              </button>

              {/* Thanh chia dòng */}
              <div className="relative flex items-center gap-4 py-4">
                <div className="flex-grow border-t border-[rgba(214,206,196,0.6)]"></div>
                <span className="text-xs font-medium text-[#57534E]/60 uppercase">or continue with</span>
                <div className="flex-grow border-t border-[rgba(214,206,196,0.6)]"></div>
              </div>

              {/* Khu vực liên kết mạng xã hội doanh nghiệp */}
              <div className="grid grid-cols-2 gap-4">
                <button className="h-12 border border-[rgba(214,206,196,0.6)] rounded-xl flex items-center justify-center gap-3 text-sm font-medium text-[#1C1917] hover:bg-[#FAF8F5] active:opacity-80 transition-all" type="button">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  Google
                </button>
                <button className="h-12 border border-[rgba(214,206,196,0.6)] rounded-xl flex items-center justify-center gap-3 text-sm font-medium text-[#1C1917] hover:bg-[#FAF8F5] active:opacity-80 transition-all" type="button">
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path d="M0 0h23v23H0z" fill="#f3f3f3"></path>
                    <path d="M1 1h10v10H1z" fill="#f35325"></path>
                    <path d="M12 1h10v10H12z" fill="#81bc06"></path>
                    <path d="M1 12h10v10H1z" fill="#05a6f0"></path>
                    <path d="M12 12h10v10H12z" fill="#ffba08"></path>
                  </svg>
                  Microsoft
                </button>
              </div>
            </form>

            {/* Chân liên hệ hỗ trợ tài khoản & Nút chuyển hướng Sign Up */}
            <p className="mt-8 text-sm text-[#57534E] text-center">
              Don't have an account?{" "}
              <button 
                type="button" 
                onClick={onSignUpClick} 
                className="text-[#0D9488] font-semibold hover:underline active:scale-95"
              >
                Sign Up here
              </button>
            </p>
          </div>

          {/* Điều khoản pháp lý góc dưới */}
          <div className="absolute bottom-6 text-[#57534E]/40 flex gap-4">
            <span className="text-xs font-medium cursor-pointer hover:text-[#57534E]/60 transition-colors">Privacy Policy</span>
            <span className="text-xs font-medium cursor-pointer hover:text-[#57534E]/60 transition-colors">Terms of Service</span>
          </div>
        </section>
      </main>
    </div>
  );
}