"use client";

export const runtime = "edge";

interface UserProfile { name: string; picture: string; }
interface SidePaneProps { isOpen: boolean; onClose: () => void; user: UserProfile | null; logout: () => void; }

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-11.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const MenuItemIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 1 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);


export default function SidePane({ isOpen, onClose, user, logout }: SidePaneProps) {
    const menuItems = ['About', '利用規約', 'プライバシーポリシー', '運営者情報'];
    
    const handleLogoutClick = () => {
        if (window.confirm("本当にログアウトしますか？")) {
            logout();
            onClose();
        }
    };

    return (
        <main>
            <div className={`fixed inset-0 bg-black/50 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <aside
                className={`fixed top-0 right-0 h-full w-72 shadow-lg transform transition-transform z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ background: "var(--card)", color: "var(--card-foreground)" }}
            >
                <nav className="p-4 flex flex-col h-full">
                    <ul className="space-y-1">
                        {menuItems.map(item => (
                            <li key={item}>
                                <a href="#" className="btn-sidepane">
                                    <MenuItemIcon />
                                    <span>{item}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-8">
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Language</p>
                        <div className="flex space-x-3 px-2">
                            <span>🇯🇵</span><span>🇺🇸</span><span>🇨🇳</span><span>🇰🇷</span>
                        </div>
                    </div>
                    <div className="mt-auto">
                        {user && (
                            <>
                                <div className="flex items-center gap-4 mb-2 p-2">
                                    <img src={user.picture} alt="user avatar" className="w-10 h-10 rounded-full" />
                                    <span className="font-semibold">{user.name}</span>
                                </div>
                                <button onClick={handleLogoutClick} className="btn-sidepane">
                                    <LogoutIcon />
                                    <span>ログアウト</span>
                                </button>
                            </>
                        )}
                    </div>
                </nav>
            </aside>
        </main>
    );
}