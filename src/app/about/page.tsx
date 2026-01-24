import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-muted">
        <h1 className="text-3xl font-bold mb-6 text-foreground">About</h1>
        
        <div className="space-y-4 font-normal">
          <p>
            「Café Timer」は、ゲーム『ブルーアーカイブ』のカフェ機能を支援する非公式ファンメイドツールです。<br />
            生徒さんのカフェ訪問タイミングを通知でお知らせし、先生方の業務をサポートします。
          </p>
          
          <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">主な機能</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>生徒さんの再タップ可能タイミングのカウントダウン</li>
            <li>生徒さんの訪問タイミング（4:00/16:00 JST）のカウントダウン</li>
            <li>招待券のクールタイム管理</li>
            <li>タップ履歴のカレンダー表示</li>
          </ul>
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