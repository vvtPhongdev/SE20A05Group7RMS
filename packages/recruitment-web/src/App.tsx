import React, { useState } from "react";
import RecruitmentSystem from "./RecruitmentSystem";
import Login from "./Login";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import VerifyEmail from "./VerifyEmail"; 

function App() {
  // Quản lý 5 trạng thái trang của hệ thống lifecycle RMS
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'signup' | 'forgot' | 'verify'>('landing');

  // Các hàm điều hướng tập trung
  const navigateToLanding = () => setCurrentPage('landing');
  const navigateToLogin = () => setCurrentPage('login');
  const navigateToSignUp = () => setCurrentPage('signup');
  const navigateToForgot = () => setCurrentPage('forgot');
  const navigateToVerify = () => setCurrentPage('verify');

  return (
    <>
      {currentPage === 'landing' && (
        <RecruitmentSystem onSignInClick={navigateToLogin} />
      )}
      
      {currentPage === 'login' && (
        <Login 
          onLogoClick={navigateToLanding} 
          onSignUpClick={navigateToSignUp}
          onForgotPasswordClick={navigateToForgot} 
        />
      )}
      
      {currentPage === 'signup' && (
        <SignUp 
          onSignInClick={navigateToLogin} 
          onSignUpSuccess={navigateToVerify} 
        />
      )}
      
      {currentPage === 'forgot' && (
        <ForgotPassword onBackToSignIn={navigateToLogin} />
      )}
      
      {currentPage === 'verify' && (
        <VerifyEmail onBackToSignUp={navigateToSignUp} />
      )}
    </>
  );
}

export default App;