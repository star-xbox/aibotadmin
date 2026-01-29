import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Menu } from 'lucide-react';
interface SiteHeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}
export function SiteHeader({ sidebarOpen, setSidebarOpen }: SiteHeaderProps) {
    const { authData } = useAuth();
    return (
        <header className="bg-white border-b border-gray-200 px-1 py-2 fixed top-0 left-0 right-0 z-30">
            <div className="flex items-center justify-between max-w-screen-3xl"> 
                {/* Left: Toggle + Logo */}
                <div className="flex items-center gap-1">
                    <div className="flex items-center">
                        <div className="ps-0">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                            >
                                {sidebarOpen ? (
                                    <Menu className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <Menu className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                        </div>
                        <div className="flex gap-2 ps-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mt-1">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <div className="pt-2">
                                <h1 className="text-xl font-bold text-gray-900 ">AI ChatBot Admin</h1>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Right: User Info */}
                <div className="flex items-center gap-3 pe-4">
                    <div className="text-right hidden sm:block"> 
                        <div className="text-sm font-medium text-gray-900">{authData?.adminUserName}</div>
                        <div className="text-xs text-gray-600">{authData?.adminUserMail}</div>
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {authData?.adminUserName?.charAt(0) || 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
}