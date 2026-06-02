// src/components/ApprovalQueue.tsx
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ApprovalTable from './ApprovalTable';

const ApprovalQueue = () => {
  return (
    <div className="flex bg-[#FAF8F5] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Approval Queue</h2>
          {/* Bạn có thể truyền props 'filter="pending"' để bảng chỉ hiện các mục cần phê duyệt */}
          <ApprovalTable /> 
        </main>
      </div>
    </div>
  );
};

export default ApprovalQueue;