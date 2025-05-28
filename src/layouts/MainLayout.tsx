import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header/Header';
import Sidebar from './SideBar/Sidebar';
const MainLayout: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 bg-white shadow">
                <Header isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
            </header>
            <div className="flex flex-1">
                <Sidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
                <main className="flex-1 flex flex-col h-[calc(100vh-1.5rem)] overflow-y-auto">
                    <div className="flex-1">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
