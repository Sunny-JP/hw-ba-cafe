import Link from 'next/link';

export default function OperatorPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-muted">
        <h1 className="text-3xl font-bold mb-6 text-foreground">運営者情報</h1>
        
        <div className="space-y-4 text-muted-foreground">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-foreground">開発・運営</h3>
            <p>さにー (@156miyako)</p>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <h3 className="font-bold text-foreground">連絡先</h3>
            <p>不具合報告やご要望は、以下のリンク（GitHubのissue/PR または X/Twitter）までお願いいたします。</p>
            <p>なお、個人開発ゆえに全ての不具合やご要望に対応できない場合があります。ご了承ください。</p>
            <ul className="list-disc pl-5 text-blue-400">
              <li>
                <a href="https://github.com/Sunny-JP/hw-ba-cafe" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://x.com/156miyako" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  X (Twitter)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4">
          <Link href="/" className="btn-setting inline-block text-center w-full sm:w-auto">
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}