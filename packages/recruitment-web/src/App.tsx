import React, { useState } from "react";
import RecruitmentSystem from "./RecruitmentSystem";
import Login from "./Login";

function App() {
  // Quản lý trang hiện tại: mặc định là 'landing' (RecruitmentSystem)
  const [currentPage, setCurrentPage] = useState<'landing' | 'login'>('landing');

  // Hàm điều hướng qua lại giữa các trang
  const navigateToLogin = () => setCurrentPage('login');
  const navigateToLanding = () => setCurrentPage('landing');

  return (
    <>
      {currentPage === 'landing' ? (
        // Truyền hàm navigateToLogin vào component RecruitmentSystem
        <RecruitmentSystem onSignInClick={navigateToLogin} />
      ) : (
        // Truyền hàm navigateToLanding vào component Login
        <Login onLogoClick={navigateToLanding} />
      )}
    </>
  );
}

export default App;