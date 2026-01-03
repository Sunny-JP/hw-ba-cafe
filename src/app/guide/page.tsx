import Link from 'next/link';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-muted">
        <h1 className="text-3xl font-bold mb-6 text-foreground">使い方ガイド</h1>
        
        <div className="space-y-6 text-muted-foreground">
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground border-b border-muted pb-2">
              🟦 カフェタイマーの使い方
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Next Tap:</strong> 生徒さんと触れ合うことができるまでの時間をカウントダウンします。「Tap」ボタンを押すと履歴が記録され、カウントダウンが始まります。
              </li>
              <li>
                <strong>Next Call:</strong> 生徒さんを招待するチケット（招待券）のクールタイムを管理します。使用した時刻にボタンを押すと、次の使用可能時刻までのカウントダウンが始まります。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground border-b border-muted pb-2">
              🟦 通知設定について
            </h2>
            <p className="mb-4">
              メニュー内の「通知設定」から、生徒さんと触れ合える時刻をプッシュ通知でお知らせします。
            </p>
            
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
              <p className="font-bold mb-2">⚠️ 通知設定がうまくいかない場合</p>
              <p>
                <strong>AdGuard</strong> や <strong>uBlock Origin</strong> などの広告ブロック（コンテンツブロッカー）機能を使用している場合、通知システムが「トラッキング」と誤認され、許可ダイアログが表示されないことがあります。
              </p>
              <p className="mt-2">
                通知設定を行う際は、<strong>このサイト（ドメイン）を許可リストに追加するか、一時的に機能をOFFにして</strong>からページを再読み込みしてください。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground border-b border-muted pb-2">
              🟨 履歴と同期
            </h2>
            <p>
              Discordログインにより、タップ履歴がサーバーに保存されます。
              同じアカウントでログインすると、PCやスマホなど異なる端末でも同じデータを共有・同期できます。
            </p>
          </section>

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