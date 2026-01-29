import { useNavigate } from 'react-router';
import { useAuth } from "@/hooks/use-auth";
import {
    Users,
    MessageSquare,
    LogOut,
    ListTree,
    Folder,
    ShieldUser
} from 'lucide-react';
type TabType = 'admins' | 'users' | 'chats' | 'chats-list' | 'files';
interface SidebarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    sidebarOpen: boolean;
}
export function Sidebar({ activeTab, setActiveTab, sidebarOpen }: SidebarProps) {
    const navigate = useNavigate();
    const { logoutUser } = useAuth();
    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };
    const menuItems = [
        { id: 'chats' as TabType, label: 'Chat History', icon: MessageSquare },
        { id: 'chats-list' as TabType, label: 'Chat List', icon: ListTree },
        { id: 'files' as TabType, label: 'Blob Management', icon: Folder },
        { id: 'admins' as TabType, label: 'Admin Management', icon: ShieldUser },
        { id: 'users' as TabType, label: 'User Management', icon: Users },
    ];
    return (
        <aside
            className={`fixed left-0 top-[61px] bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-20 overflow-hidden ${sidebarOpen ? 'w-64' : 'w-0 md:w-13.5'
                }`}
        >
            <div className="flex flex-col h-full mt-1">
                {/* Navigation */}
                <nav className="flex-1 p-1 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === item.id
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                title={!sidebarOpen ? item.label : undefined}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className={`whitespace-nowrap transition-opacity duration-300 ${sidebarOpen ? ' ps-2 opacity-100' : 'opacity-0 w-0 overflow-hidden'
                                    }`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
                {/* Logout Button */}
                <div className="p-2 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title={!sidebarOpen ? 'Logout' : undefined}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span className={`whitespace-nowrap transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                            }`}>
                            Logout
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
}