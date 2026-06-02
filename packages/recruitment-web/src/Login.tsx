import React, { useState } from "react";

interface LoginProps {
  onLogoClick: () => void;
  onSignUpClick: () => void;
  onForgotPasswordClick: () => void;
  onLoginSuccess: () => void; // Thêm hàm này để chuyển vào Dashboard
}

export default function Login({ 
  onLogoClick, 
  onSignUpClick, 
  onForgotPasswordClick, 
  onLoginSuccess 
}: LoginProps) {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tại đây bạn có thể thêm logic gọi API đăng nhập
    console.log("Xử lý đăng nhập với:", { email, password, rememberMe });
    
    // Chuyển vào Dashboard sau khi login
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] text-[#1C1917] font-sans antialiased">
      <main className="w-full max-w-[1440px] h-screen flex flex-col md:flex-row shadow-2xl bg-white">
        
        {/* CỘT TRÁI: Thương hiệu */}
        <section className="hidden md:flex md:w-[60%] h-full bg-[#FAF8F5] relative flex-col p-8 border-r border-[#D6CEC4]/60">
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-auto">
              <h1 className="text-3xl font-semibold leading-tight">Recruitment Workflow Management System</h1>
              <p className="text-lg text-[#57534E] mt-4">Streamline hiring decisions. Track every step. A unified platform for enterprise talent acquisition.</p>
            </div>
            {/*  */}
            <div className="flex-grow flex items-center justify-center">
              <img alt="Workflow" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpBTBbhUGzc3jsdiHn5uQ8SUu4dfQWvltqWhgUoFsR9Pyc9eCCG19MS47PX7k0ElDn_-qIMk8u6ERwQyK_zse4Ak56a1odBnbuFSOKN5GLk2L9KZvBm7vAovoGdRzgeSXTioj6dWlND4mR_T9X6c2xOJ4FGC6SjIYWyXSj4uQB7RlXIhb8E5x8CrNeH641nt_8kRvRYnJL9pHUZuSgyOtGOmWt3F077sNBpihsEgsaoExgGLXUF5uUEOFNYhac5_towyQs0-SbONE" className="max-w-md" />
            </div>
            <div className="mt-auto">
              <p className="text-xs uppercase tracking-wider font-medium text-[#57534E]">Trusted by leading Vietnamese enterprises</p>
            </div>
          </div>
        </section>

        {/* CỘT PHẢI: Form Đăng Nhập */}
        <section className="w-full md:w-[40%] flex items-center justify-center p-6">
          <div className="w-full max-w-[400px]">
            <div className="text-center mb-8">
              <span onClick={onLogoClick} className="text-2xl text-[#0D9488] font-extrabold cursor-pointer">RMS</span>
              <h2 className="text-2xl mt-4 font-semibold">Welcome back</h2>
              <p className="text-[#57534E]">Sign in to your account</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-[#57534E] mb-2 block">Email Address</label>
                <input 
                  className="w-full h-12 px-4 border border-[#D6CEC4]/60 rounded-xl focus:ring-2 focus:ring-[#0D9488] outline-none" 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#57534E] mb-2 block">Password</label>
                <div className="relative">
                  <input 
                    className="w-full h-12 px-4 border border-[#D6CEC4]/60 rounded-xl focus:ring-2 focus:ring-[#0D9488] outline-none" 
                    type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={togglePassword} className="absolute right-4 top-4 text-sm text-[#57534E]">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  Remember me
                </label>
                <button type="button" onClick={onForgotPasswordClick} className="text-[#0D9488] font-semibold hover:underline">Forgot password?</button>
              </div>

              <button type="submit" className="w-full h-12 bg-[#0D9488] text-white rounded-xl font-medium hover:bg-[#00685f] transition-all">
                Sign In
              </button>
            </form>

            <p className="mt-8 text-sm text-center">
              Don't have an account?{" "}
              <button onClick={onSignUpClick} className="text-[#0D9488] font-semibold hover:underline">Sign Up here</button>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}