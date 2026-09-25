import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const DashboardLayout = ({ title = 'TrustPay', children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar
          title={title}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
