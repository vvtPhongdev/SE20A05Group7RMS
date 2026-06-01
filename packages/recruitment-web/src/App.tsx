import React, { useState } from "react";
import RecruitmentSystem from "./RecruitmentSystem";
import Login from "./Login";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword"; // Import tệp Quên mật khẩu

function App() {
  // Quản lý 4 trạng thái trang: 'landing', 'login', 'signup', hoặc 'forgot'
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'signup' | 'forgot'>('landing');

  return (
    <>
      {currentPage === 'landing' ? (
        <RecruitmentSystem onSignInClick={() => setCurrentPage('login')} />
      ) : currentPage === 'login' ? (
        <Login 
          onLogoClick={() => setCurrentPage('landing')} 
          onSignUpClick={() => setCurrentPage('signup')} 
          onForgotPasswordClick={() => setCurrentPage('forgot')} // Điều hướng sang Forgot Password
        />
      ) : currentPage === 'signup' ? (
        <SignUp onSignInClick={() => setCurrentPage('login')} />
      ) : (
        <ForgotPassword onBackToSignIn={() => setCurrentPage('login')} /> // Từ Forgot quay lại Login
      )}
    </>
  );
}

export default App;