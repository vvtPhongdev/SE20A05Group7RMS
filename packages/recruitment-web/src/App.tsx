import React, { useState } from "react";
import RecruitmentSystem from "./RecruitmentSystem";
import Login from "./Login";
import SignUp from "./SignUp";
import VerifyEmail from "./VerifyEmail";
import Dashboard from './Dashboard';
import Sidebar from './components/Sidebar';

// Định nghĩa các trang trong hệ thống
export enum Page {
  LANDING = 'landing',
  LOGIN = 'login',
  SIGNUP = 'signup',
  VERIFY = 'verify',
  DASHBOARD = 'dashboard',
  APPROVAL_QUEUE = 'approval_queue',
  ALL_REQUESTS = 'all_requests',
  INTERVIEW_RESULTS = 'interview_results',
  USERS = 'users',
  DEPARTMENTS = 'departments',
  REPORTS = 'reports',
  SETTINGS = 'settings'
}

function App() {
  // State quản lý trang hiện tại
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);

  // Render function để quản lý luồng điều hướng
  const renderPage = (): JSX.Element => {
    switch (currentPage) {
      case Page.LANDING:
        return (
          <RecruitmentSystem 
            onSignInClick={() => setCurrentPage(Page.LOGIN)} 
          />
        );

      case Page.LOGIN:
        return (
          <Login 
            onLogoClick={() => setCurrentPage(Page.LANDING)} 
            onSignUpClick={() => setCurrentPage(Page.SIGNUP)}
            onForgotPasswordClick={() => console.log("Chuyển hướng quên mật khẩu")} 
            onLoginSuccess={() => setCurrentPage(Page.DASHBOARD)}
          />
        );

      case Page.SIGNUP:
        return (
          <SignUp 
            onSignInClick={() => setCurrentPage(Page.LOGIN)} 
            onSignUpSuccess={() => setCurrentPage(Page.VERIFY)} 
          />
        );

      case Page.VERIFY:
        return (
          <VerifyEmail 
            onBackToSignUp={() => setCurrentPage(Page.SIGNUP)} 
            onVerifySuccess={() => setCurrentPage(Page.DASHBOARD)} 
          />
        );

      case Page.DASHBOARD:
      case Page.APPROVAL_QUEUE:
      case Page.ALL_REQUESTS:
      case Page.INTERVIEW_RESULTS:
      case Page.USERS:
      case Page.DEPARTMENTS:
      case Page.REPORTS:
      case Page.SETTINGS:
        return (
          <Dashboard 
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onLogout={() => setCurrentPage(Page.LANDING)} 
          />
        );

      default:
        return (
          <RecruitmentSystem 
            onSignInClick={() => setCurrentPage(Page.LOGIN)} 
          />
        );
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#FAF8F5]">
      {renderPage()}
    </div>
  );
}

export default App;