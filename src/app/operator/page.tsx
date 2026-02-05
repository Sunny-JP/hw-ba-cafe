import Link from 'next/link';

export default function OperatorPage() {
  const updateLogs = [
    { date: '2026-02-05', content: 'Ver.1.0 リリース' },
  ];

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-muted">
        <h1 className="text-3xl font-bold mb-6 text-foreground">運営者情報・変更履歴</h1>
        
        <div className="space-y-6 text-muted-foreground">
          {/* 運営・開発情報 */}
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-foreground border-b border-muted pb-1">運営代表・開発</h3>
              <p className="font-normal">
                さにー　X: <a href="https://x.com/156miyako" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">@156miyako</a>
                　HP: <a href="https://rabbit1.cc" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">https://rabbit1.cc</a>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-foreground border-b border-muted pb-1">開発協力</h3>
              <p className="font-normal">
                ハチか　X: <a href="https://x.com/bite_sour_sweet" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">@bite_sour_sweet</a>
              </p>
            </div>
          </div>

          {/* 変更履歴セクション */}
          <div className="flex flex-col gap-1 pb-2">
            <h3 className="font-bold text-foreground border-b border-muted pb-1">変更履歴</h3>
            <div className="bg-background/50 rounded-md p-1.5 max-h-48 overflow-y-auto space-y-2 text-sm">
              {updateLogs.map((log, index) => (
                <div key={index} className="flex gap-3 border-b border-muted/30 pb-1.5 last:border-0">
                  <span className="font-mono shrink-0">{log.date}</span>
                  <p className="text-foreground/80">{log.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 連絡先 */}
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-foreground border-b border-muted pb-1">連絡先・フィードバック</h3>
            <p className="text-sm leading-relaxed">
              不具合報告やご要望は、 
              <a href="https://github.com/Sunny-JP/hw-ba-cafe" target="_blank" rel="noopener noreferrer" className="mx-1 hover:underline text-blue-400 font-bold">
                GitHub
              </a> 
              または X (Twitter) までお願いいたします。<br />
              個人開発のため全ての対応は難しい場合がありますが、Pull Requestなど積極的に受け付けています。
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4">
          <Link href="/" className="btn-setting inline-block text-center w-full">
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}