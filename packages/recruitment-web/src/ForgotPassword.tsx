import React, { useState } from "react";

interface ForgotPasswordProps {
  onBackToSignIn: () => void;
}

export default function ForgotPassword({ onBackToSignIn }: ForgotPasswordProps) {
  // --- State quản lý Form ---
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // --- Hàm xử lý gửi yêu cầu reset mật khẩu ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Giả lập gọi API trong 1.5 giây giống đoạn Script cũ
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      console.log("Đã gửi mã xác thực reset mật khẩu đến email:", email);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden bg-[#FAF8F5] text-[#171d1c] font-['IBM_Plex_Sans'] antialiased">
      <main className="flex min-h-screen w-full max-w-[1440px] mx-auto shadow-2xl transition-all duration-700">
        
        {/* CỘT TRÁI: Thương hiệu & Thông tin hệ thống (55%) */}
        <section className="relative w-[55%] hidden md:flex items-center px-8 overflow-hidden bg-[#00685f]">
          {/* Ảnh nền văn phòng doanh nghiệp */}
          <div className="absolute inset-0 z-0">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0pPtO8AmzHS5KCW7kK-raDo-sBT-yN4VxRI-aQKaGjGiqX-RnrSK1YHQ2mEygCMiwHvpw7W4hjHPEutOuXME_uSlhg9Jj5fx9txlhE4NlTaN1EqQb4gQbdZxguywjNQo3lFXYr0Z2TXKI52PkR0bN4TVGBxxKaoGFcpPEC1gajKyPcpe4cyi8L4enx8dI-zRJmLfym_2uAeeWKA1zOnfAYyhgZexLYRGRmQ9RdIcN3ytECzF9dsRvcMrhwFlHRlg_CIzGFOGDtpk" 
              alt="Enterprise Office" 
            />
          </div>
          {/* Lớp phủ họa tiết Cubes & Gradient Teal độc quyền */}
          <div 
            className="absolute inset-0 z-10 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")'
            }}
          ></div>
          <div 
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(0, 106, 97, 0.92) 0%, rgba(13, 148, 136, 0.85) 100%)"
            }}
          ></div>

          {/* Nội dung chữ cột trái */}
          <div className="relative z-30 max-w-xl">
            <div className="mb-12">
              <span className="text-2xl font-bold text-white tracking-tight">RMS Enterprise</span>
            </div>
            <h1 className="text-3xl text-white mb-4 font-semibold leading-tight">
              Reset Your Password
            </h1>
            <p className="text-lg text-white opacity-85 leading-relaxed">
              Enter your email address and we'll send you a verification code to reset your password. Our secure process ensures your candidate and pipeline data remains protected.
            </p>
            <div className="mt-12 flex items-center space-x-6 text-white/60">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <span className="text-sm font-medium">Secure Encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[20px]">speed</span>
                <span className="text-sm font-medium">Instant Delivery</span>
              </div>
            </div>
          </div>
        </section>

        {/* CỘT PHẢI: Form xử lý yêu cầu (45%) */}
        <section className="w-full md:w-[45%] bg-white flex flex-col justify-between py-8 px-20">
          
          {/* Khối điều hướng quay lại */}
          <div className="flex justify-start">
            <button 
              onClick={onBackToSignIn}
              className="group flex items-center text-[#0D9488] text-sm font-medium hover:underline transition-all active:scale-95"
            >
              <span className="material-symbols-outlined mr-2 group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              Back to Sign In
            </button>
          </div>

          {/* Form Container chính */}
          <div className="max-w-md w-full mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#f0f5f2] mb-6">
                <span className="material-symbols-outlined text-[48px] text-[#0D9488]">
                  lock_reset
                </span>
              </div>
              <h2 className="text-2xl text-[#1C1917] font-semibold mb-2">
                Forgot Password?
              </h2>
              <p className="text-sm text-[#57534E]">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#57534E] block" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#6d7a77]">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input 
                    className="w-full bg-[#FAF8F5] border border-[rgba(214,206,196,0.6)] rounded-lg py-3.5 pl-11 pr-4 text-[#171d1c] text-sm placeholder:text-[#ccc5c2] outline-none transition-all focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20" 
                    id="email" 
                    type="email"
                    placeholder="name@company.com" 
                    required 
                    disabled={isLoading || isSubmitted}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Nút bấm xử lý theo trạng thái State liên hoàn */}
              <button 
                className={`w-full text-white text-sm font-medium py-4 rounded-lg shadow-sm transition-all duration-200 ${
                  isSubmitted 
                    ? "bg-[#059669]" 
                    : "bg-[#0D9488] hover:bg-[#008378] active:scale-[0.98]"
                }`}
                type="submit"
                disabled={isLoading || isSubmitted}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : isSubmitted ? (
                  <div className="flex items-center justify-center">
                    <span className="material-symbols-outlined mr-2">check_circle</span>
                    Email Sent Successfully
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              {/* Thông báo nảy Bounce sau khi gửi thành công */}
              {isSubmitted && (
                <p className="text-center text-[#059669] text-sm font-medium mt-4 animate-bounce">
                  Please check your inbox for instructions.
                </p>
              )}
            </form>

            <div className="mt-8 text-center">
              <p className="text-[#57534E] text-xs">
                Remember your password? 
                <button 
                  onClick={onBackToSignIn}
                  className="text-[#0D9488] font-semibold ml-1 hover:underline active:scale-95"
                >
                  Sign in
                </button>
              </p>
            </div>

            {/* Hộp thông báo hỗ trợ bên dưới form */}
            <div className="mt-12 p-4 bg-[#FAF8F5] rounded-xl border border-[rgba(214,206,196,0.6)]">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-[#57534E] text-[18px] shrink-0 mt-0.5">info</span>
                <p className="text-xs text-[#57534E] leading-snug">
                  If you don't receive an email within 5 minutes, check your spam folder or contact your administrator.
                </p>
              </div>
            </div>
          </div>

          {/* Bản quyền Enterprise Edition */}
          <div className="flex justify-center text-[#ccc5c2] text-xs">
            <span>© 2024 Recruitment Management Suite. Enterprise Edition.</span>
          </div>
        </section>
      </main>
    </div>
  );
}