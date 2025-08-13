"use client";

interface UserProfile {
    name: string;
    picture: string;
}

interface SidePaneProps {
    isOpen: boolean;
    onClose: () => void; // ペインを閉じるための関数
    user: UserProfile | null;
    logout: () => void;  // ログアウト処理を行う関数
}

// ログアウトアイコン
const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export default function SidePane({ isOpen, onClose, user, logout }: SidePaneProps) {
    const menuItems = ['About', '利用規約', 'プライバシーポリシー', 'お問い合わせ', '運営者情報'];
    
    const handleLogoutClick = () => {
        if (window.confirm("本当にログアウトしますか？")) {
            logout();
            onClose();
        }
    };

    return (
        <main>
            {/* オーバーレイ */}
            <div 
                className={`fixed inset-0 bg-black/50 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>
            
            {/* サイドペイン本体 */}
            <aside 
                className={`fixed top-0 right-0 h-full w-72 bg-gray-800 text-white shadow-lg transform transition-transform z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <nav className="p-6 flex flex-col h-full">
                    {/* メニュー項目 */}
                    <ul className="space-y-4">
                        {menuItems.map(item => <li key={item}><a href="#" className="hover:text-blue-300">{item}</a></li>)}
                    </ul>
                    
                    {/* 言語選択 */}
                    <div className="mt-8">
                        <p className="text-sm text-gray-400 mb-2">Language</p>
                        <div className="flex space-x-3">
                            <span>🇯🇵</span><span>🇺🇸</span><span>🇨🇳</span><span>🇰🇷</span>
                        </div>
                    </div>

                    {/* 認証情報*/}
                    <div className="mt-auto">
                        {/* userが存在する場合（ログイン中）のみ、このブロックを表示 */}
                        {user && (
                            <>
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={user.picture} alt="user avatar" className="w-10 h-10 rounded-full" />
                                    <span className="font-semibold">{user.name}</span>
                                </div>
                                <button onClick={handleLogoutClick} className="btn btn-ghost w-full justify-start text-left !text-white">
                                    <LogoutIcon /> ログアウト
                                </button>
                            </>
                        )}
                        {/* userが存在しない場合は何も表示しない */}
                    </div>
                </nav>
            </aside>
        </main>
    );
}