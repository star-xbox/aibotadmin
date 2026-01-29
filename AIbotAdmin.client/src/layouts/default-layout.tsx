import { SiteHeader } from "@/components/site-header";
import type { ReactNode } from "react";
interface DefaultLayoutProps {
    children: ReactNode;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}
export default function DefaultLayout({ children, sidebarOpen, setSidebarOpen }: DefaultLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div
                className={`flex-1 transition-all duration-300 pt-[73px] ${sidebarOpen ? 'ml-64' : 'ml-0 md:ml-14'
                    } max-w-full overflow-x-hidden`} 
            >
                <main className="flex-1">
                    {children}
                </main>
                {/*<SiteFooter />*/}
            </div>
        </div>
    );
}