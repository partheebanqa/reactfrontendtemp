import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Footer from './Footer/Footer';
import Header from './Header/Header';
import Sidebar from './SideBar/Sidebar';
const MainLayout: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };
    return (
        <div className="flex flex-col min-h-screen">
            <Header isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
            <div className="flex flex-1">
                <Sidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
                <main className="flex-1 flex flex-col">
                    <div className="flex-1">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
