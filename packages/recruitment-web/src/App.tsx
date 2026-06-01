import React, { useState } from "react";
import RecruitmentSystem from "./RecruitmentSystem";
import Login from "./Login";
import SignUp from "./SignUp"; // Import thêm component SignUp vừa tạo

function App() {
  // Quản lý trạng thái trang hiện tại: mở rộng gồm 'landing', 'login', hoặc 'signup'
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'signup'>('landing');

  // Các hàm điều hướng tập trung
  const navigateToLanding = () => setCurrentPage('landing');
  const navigateToLogin = () => setCurrentPage('login');
  const navigateToSignUp = () => setCurrentPage('signup');

  return (
    <>
      {currentPage === 'landing' ? (
        // Trang chủ: Bấm Sign In điều hướng sang trang Login
        <RecruitmentSystem onSignInClick={navigateToLogin} />
      ) : currentPage === 'login' ? (
        // Trang Login: 
        // - Bấm logo RMS về lại Landing
        // - Bấm Sign Up chuyển tiếp sang trang Đăng ký
        <Login 
          onLogoClick={navigateToLanding} 
          onSignUpClick={navigateToSignUp} 
        />
      ) : (
        // Trang SignUp: Bấm Sign In chuyển ngược lại trang Login
        <SignUp onSignInClick={navigateToLogin} />
      )}
    </>
  );
}

export default App;