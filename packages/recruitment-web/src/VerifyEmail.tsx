import React, { useState, useEffect } from 'react';

// 1. Định nghĩa Props để nhận lệnh điều hướng từ App.tsx
interface VerifyEmailProps {
  onBackToSignUp: () => void;
  onVerifySuccess: () => void;
}

export default function VerifyEmail({ onBackToSignUp, onVerifySuccess }: VerifyEmailProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Kiểm tra xem OTP đã nhập đủ 6 số chưa
  const isOtpComplete = otp.every(digit => digit !== '');

  // 2. Hàm xử lý khi người dùng nhập số
  const handleOtpChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen flex items-center justify-center p-6 antialiased text-[#171d1c]">
      <main className="w-full max-w-[480px] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[rgba(214,206,196,0.6)] overflow-hidden">
        
        <div className="w-full h-1 bg-[#F5F3F0]">
          <div className="h-full bg-[#0D9488] w-2/3"></div>
        </div>

        <div className="px-10 pt-12 pb-10 flex flex-col items-center">
          <div className="mb-8 flex items-center gap-2">
            <div className="w-10 h-10 bg-[#0D9488] rounded-lg flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-white text-2xl">hub</span>
            </div>
            <span className="text-2xl font-bold text-[#0D9488] tracking-tight">RecruitFlow</span>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-[#1C1917] mb-3">Verify Your Email</h1>
            <p className="text-base text-[#57534E] leading-relaxed">
              We've sent a 6-digit code to <span className="font-semibold text-[#0D9488]">tran.ngoc.mai@gmail.com</span>
            </p>
          </div>

          <div className="w-full mb-8">
            {/* 3. Render các ô Input thực tế thay vì div tĩnh */}
            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className={`w-12 h-14 border-2 rounded-lg text-center font-['IBM_Plex_Mono'] text-[28px] font-medium outline-none transition-all ${
                    digit ? 'border-[#1C1917]' : 'border-[rgba(214,206,196,0.6)]'
                  } focus:border-[#0D9488]`}
                />
              ))}
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-2 text-[#57534E]">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span className="font-['IBM_Plex_Mono'] text-sm">
                  Code expires in <span className="font-semibold text-[#1C1917]">4:30</span>
                </span>
              </div>
              <button className="text-sm text-[#57534E] hover:text-[#0D9488] transition-colors">
                Didn't receive a code? <span className="font-semibold">Resend Code</span>
              </button>
            </div>
          </div>

          {/* 4. Logic nút Verify: Chỉ sáng lên khi nhập đủ */}
          <button 
            onClick={onVerifySuccess}
            disabled={!isOtpComplete}
            className={`w-full h-12 text-white font-medium rounded-xl shadow-sm flex items-center justify-center transition-all ${
              isOtpComplete ? 'bg-[#0D9488] hover:bg-[#00685f]' : 'bg-[#0D9488] opacity-40 cursor-not-allowed'
            }`}
          >
            Verify Email
          </button>

          <div className="mt-8 flex flex-col items-center gap-4 border-t border-[rgba(214,206,196,0.6)] pt-8 w-full">
            <button onClick={onBackToSignUp} className="text-sm text-[#0D9488] font-medium hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Wrong email? Go Back
            </button>
            <p className="text-xs text-[#57534E]">Having trouble? <a href="#" className="text-[#0D9488] font-semibold hover:underline">Contact support</a></p>
          </div>
        </div>

        <div className="bg-[#F5F3F0] py-4 px-10 flex justify-center items-center gap-2 border-t border-[rgba(214,206,196,0.6)]">
          <span className="material-symbols-outlined text-[#57534E] text-[14px]">lock</span>
          <span className="text-xs text-[#57534E]">This code is valid for 10 minutes</span>
        </div>
      </main>
    </div>
  );
}