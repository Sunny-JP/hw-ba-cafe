import Link from 'next/link';

export default function GuidePage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-muted">
        <h1 className="text-3xl font-bold mb-6 text-foreground">使い方ガイド</h1>
        
        <div className="space-y-6 font-normal">
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
              🟨 Tap履歴の使い方
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>SAVE IMAGE:</strong> Tap履歴を月ごとに画像で保存できます。SNSへの投稿などにご利用いただけます。
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground border-b border-muted pb-2">
              🟦 履歴と同期
            </h2>
            <p>
              Discordログインにより、タップ履歴がサーバーに保存されます。
              同じアカウントでログインすると、PCやスマホなど異なる端末でも同じデータを共有・同期できます。
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3 text-foreground border-b border-muted pb-2">
              🟨 通知設定について
            </h2>
            <p className="mb-4">
              メニュー内の「通知設定」から、生徒さんと触れ合える時刻をプッシュ通知でお知らせします。
              4:00/16:00 JSTについては、時刻が固定されている&負荷軽減のため、通知を行いません。<br />
            </p>
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 text-sm mb-4">
              <p className="font-bold mb-2">ℹ️ お願い</p>
              <p>
                通知登録されている端末数が増加すると、運営者の大人のカードの出番がやってきてしまいます。
              </p>
              <p className="mt-1">
                通知登録は1ユーザーあたり2端末までを目安とし、通知が不要な端末は都度登録解除していただくよう、何卒ご協力をお願いいたします。
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-sm">
              <p className="font-bold mb-2">⚠️ 通知設定がうまくいかない場合</p>
              <p>
                <strong>AdGuard</strong> や <strong>uBlock Origin</strong> などの広告ブロック（コンテンツブロッカー）機能を使用している場合、通知システムが「トラッキング」と誤認され、許可ダイアログが表示されないことがあります。
              </p>
              <p className="mt-1">
                通知設定を行う際は、<strong>このサイト（ドメイン）を許可リストに追加する</strong>か、<strong>一時的に機能をOFF</strong>にしてからページを再読み込み・通知設定を行ってください。
              </p>
            </div>
          </section>
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