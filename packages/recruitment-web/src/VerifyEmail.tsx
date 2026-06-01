import React, { useState, useEffect, useRef } from 'react';

interface VerifyEmailProps {
  onBackToSignUp: () => void;
}

export default function VerifyEmail({ onBackToSignUp }: VerifyEmailProps) {
  // --- State quản lý thời gian đếm ngược (4:32 = 272 giây) ---
  const [timeLeft, setTimeLeft] = useState(272);

  // --- State quản lý mảng 6 ký tự mã OTP ---
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  
  // Trạng thái kiểm tra xem đã nhập đủ 6 ký tự chưa để mở khóa nút bấm
  const isOtpComplete = otp.every((val) => val !== '');

  // --- Quản lý danh sách các ô ref để tự động nhảy con trỏ ---
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Effect chạy đồng hồ đếm ngược
  useEffect(() => {
    if (timeLeft <= 0) return;
    const countdown = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(countdown);
  }, [timeLeft]);

  // --- Logic xử lý khi người dùng nhập ký tự ---
  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, ''); // Chỉ chấp nhận số
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Lấy số cuối cùng nhập vào
    setOtp(newOtp);

    // Tự động nhảy sang ô tiếp theo nếu chưa phải ô cuối cùng
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // --- Logic xử lý phím xóa (Backspace) ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      
      if (otp[index] !== '') {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // Hàm định dạng giây thành mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOtpComplete) {
      const otpCode = otp.join('');
      console.log('Mã OTP người dùng nhập là:', otpCode);
      alert(`Đang xác thực mã OTP: ${otpCode}`);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen flex flex-col items-center justify-center p-6 antialiased font-sans text-[#171d1c] relative overflow-hidden">
      
      {/* Khối Card chính */}
      <main className="w-full max-w-[480px] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[rgba(214,206,196,0.6)] overflow-hidden relative z-10">
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-[#F5F3F0]">
          <div className="h-full bg-[#0D9488] w-2/3 transition-all duration-700"></div>
        </div>

        {/* Cấu trúc bọc chuẩn: Thẻ <form> nằm HOÀN TOÀN bên trong thẻ <main> */}
        <form onSubmit={handleVerifySubmit} className="px-10 pt-12 pb-10 flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2">
            <div className="w-10 h-10 bg-[#0D9488] rounded-lg flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                hub
              </span>
            </div>
            <span className="text-2xl font-bold text-[#0D9488] tracking-tight">RecruitFlow</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-[#1C1917] mb-3">Verify Your Email</h1>
            <p className="text-base text-[#57534E] leading-relaxed">
              We've sent a 6-digit code to <span className="font-semibold text-[#0D9488]">tran.ngoc.mai@gmail.com</span>
            </p>
          </div>

          {/* Khu vực 6 ô nhập mã OTP tương tác thực tế */}
          <div className="w-full mb-8">
            <div className="flex justify-between gap-3 mb-6" id="otp-container">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={data}
                  ref={(el) => {
                    if (el) inputRefs.current[index] = el;
                  }}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`w-12 h-14 border-2 text-center font-['IBM_Plex_Mono'] text-2xl font-semibold rounded-lg bg-[#FAF8F5] transition-all outline-none ${
                    data !== '' 
                      ? 'border-[#1C1917] text-[#1C1917]' 
                      : 'border-[rgba(214,206,196,0.6)] focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/5 focus:bg-white'
                  }`}
                />
              ))}
            </div>

            {/* Timer đếm ngược */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-2 text-[#57534E]">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span className="font-['IBM_Plex_Mono'] text-sm">
                  Code expires in{' '}
                  <span className={`font-semibold ${timeLeft <= 0 ? 'text-[#ba1a1a]' : 'text-[#1C1917]'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </span>
              </div>
              <button 
                className={`text-sm font-semibold transition-colors ${
                  timeLeft <= 0 
                    ? 'text-[#0D9488] hover:underline cursor-pointer' 
                    : 'text-[#57534E] opacity-50 cursor-not-allowed select-none'
                }`}
                disabled={timeLeft > 0}
                type="button"
                onClick={() => setTimeLeft(272)}
              >
                Didn't receive a code? <span className="text-[#0D9488]">Resend Code</span>
              </button>
            </div>
          </div>

          {/* Nút Verify kích hoạt khi điền đủ 6 số */}
          <button 
            className={`w-full h-12 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 ${
              isOtpComplete 
                ? 'bg-[#0D9488] hover:bg-[#00685f] active:scale-[0.98] cursor-pointer' 
                : 'bg-[#0D9488] opacity-40 cursor-not-allowed'
            }`}
            disabled={!isOtpComplete}
            type="submit"
          >
            Verify Email
          </button>

          {/* Nút Quay lại sửa email */}
          <div className="mt-8 flex flex-col items-center gap-4 border-t border-[rgba(214,206,196,0.6)] pt-8 w-full">
            <button 
              onClick={onBackToSignUp}
              className="text-sm text-[#0D9488] font-medium hover:underline flex items-center gap-1 active:scale-95 transition-transform"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Wrong email? Go Back
            </button>
            <p className="text-xs text-[#57534E] flex items-center gap-1.5">
              Having trouble?{' '}
              <a className="text-[#0D9488] font-semibold hover:underline" href="#support">
                Contact support
              </a>
            </p>
          </div>
        </form>

        {/* Bottom Bar */}
        <div className="bg-[#F5F3F0] py-4 px-10 flex justify-center items-center gap-2 border-t border-[rgba(214,206,196,0.6)]">
          <span className="material-symbols-outlined text-[#57534E] text-[14px]">lock</span>
          <span className="text-xs text-[#57534E]">This code is valid for 10 minutes</span>
        </div>

      </main>

      {/* Background decoration patterns */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#0D9488]/5 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#57534E]/5 blur-[100px]"></div>
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: "radial-gradient(#D6CEC4 0.5px, transparent 0.5px)", 
            backgroundSize: "32px 32px" 
          }}
        ></div>
      </div>
    </div>
  );
}