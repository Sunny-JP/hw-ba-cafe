import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-muted">
        <h1 className="text-3xl font-bold mb-6 text-foreground">利用規約</h1>
        
        <div className="space-y-4 text-muted-foreground text-sm">
          <p>この利用規約（以下、「本規約」といいます。）は、本ウェブサイト上で提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。</p>

          <h3 className="font-bold text-foreground mt-4">1. 免責事項</h3>
          <ul className="list-disc pl-5">
            <li>本サービスは現状有姿で提供され、その正確性、完全性、有用性を保証するものではありません。</li>
            <li>本サービスの利用により生じた損害（ゲーム内での損失、データ消失など）について、運営者は一切の責任を負いません。</li>
            <li>通知機能はブラウザや設定、端末、ネットワーク環境等に依存するため、確実に届くことを保証するものではありません。</li>
          </ul>

          <h3 className="font-bold text-foreground mt-4">2. 禁止事項</h3>
          <ul className="list-disc pl-5">
            <li>本サービスのサーバーに過度な負荷をかける行為<br />（Discordアカウントを複数用いてのログインは、良識の範囲内に限り許可します）</li>
            <li>不正アクセス行為</li>
            <li>本ツールを営利目的に使用する行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>

          <h3 className="font-bold text-foreground mt-4">3. サービスの変更・停止</h3>
          <ul className="list-disc pl-5">
            <li>運営者は、ユーザーに通知することなく、本サービスの内容を変更または提供を中止することができるものとします。</li>
          </ul>

          <h3 className="font-bold text-foreground mt-4">4. 著作権</h3>
          <ul className="list-disc pl-5">
            <li>本サービス中の『ブルーアーカイブ』に関係するデータ等の著作権は、株式会社Yostar、NEXON Games、およびその他の権利者に帰属します。</li>
          </ul>
          
          <p className="text-right">2026年1月1日 発効</p>
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