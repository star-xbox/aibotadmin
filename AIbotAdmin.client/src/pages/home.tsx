// HomePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AdminUserManagement } from '../components/admin-management';
import ChatHistory from '../components/chat-history';
import { UserManagement } from '../components/user-management';
import ChatList from '../components/chat-list';
import { BlobManager } from '../components/blob-management';
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from '@/components/sidebar';
import DefaultLayout from '@/layouts/default-layout';

type TabType = 'admins' | 'users' | 'chats' | 'chats-list' | 'files';

export default function HomePage() {
    const navigate = useNavigate();
    const { fetchUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('chats');

    // Xác định breakpoint mobile một lần để tái sử dụng
    const isMobile = () => window.innerWidth < 768;
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile());

    useEffect(() => {
        const checkAuth = async () => {
            await fetchUser({
                onUnauthorized: () => {
                    navigate('/login');
                }
            });
        };
        checkAuth();
    }, [navigate]);

    // Responsive: tự động mở/đóng sidebar theo kích thước màn hình
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);  // Mobile → mặc định đóng
            } else {
                setSidebarOpen(true);   // Desktop → mặc định mở
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Gọi lần đầu

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Hàm set tab mới: nếu là mobile → tự động đóng sidebar sau khi chọn
    const handleSetActiveTab = (tab: TabType) => {
        setActiveTab(tab);
        if (isMobile()) {
            setSidebarOpen(false); // Đây chính là tính năng bạn cần!
        }
    };

    // Toggle sidebar (khi nhấn nút menu)
    const handleToggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    return (
        <>
            <Sidebar
                activeTab={activeTab}
                setActiveTab={handleSetActiveTab}  // Dùng hàm mới
                sidebarOpen={sidebarOpen}
            />

            <DefaultLayout sidebarOpen={sidebarOpen} setSidebarOpen={handleToggleSidebar}>
                <div className="p-6 pt-1 overflow-x-hidden">
                    {activeTab === 'chats' && <ChatHistory />}
                    {activeTab === 'chats-list' && <ChatList />}
                    {activeTab === 'files' && <BlobManager />}
                    {activeTab === 'admins' && <AdminUserManagement />}
                    {activeTab === 'users' && <UserManagement />}
                </div>
            </DefaultLayout>
        </>
    );
}