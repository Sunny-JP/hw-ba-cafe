import Link from 'next/link';

export default function OperatorPage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-muted">
        <h1 className="text-3xl font-bold mb-6 text-foreground">運営者情報</h1>
        
        <div className="space-y-4 text-muted-foreground">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-foreground">運営代表・開発</h3>
            <p className="font-normal">
              ・さにー <a href="https://x.com/156miyako" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">@156miyako</a></p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-foreground">開発協力</h3>
            <p className="font-normal">
              ・ハチか <a href="https://x.com/bite_sour_sweet" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">@bite_sour_sweet</a></p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-foreground">連絡先</h3>
            <p className="font-normal">不具合報告やご要望は、 
              <a href="https://github.com/Sunny-JP/hw-ba-cafe" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">
                GitHubリポジトリ
              </a> のissue または X (Twitter) までお願いいたします。<br />
            なお、個人開発のため全ての不具合やご要望に対応できない場合があります。ご了承ください。<br />
            共同開発も受け付けています。GitHubリポジトリでPRしていただければ、採用されるかもしれません。バグ修正や機能改善など、積極的にご参加いただけるとありがたいです。</p>
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