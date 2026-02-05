import Link from 'next/link';

export default function FaqPage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-muted">
        <h1 className="text-3xl font-bold mb-6 text-foreground">FAQ</h1>
        
        <div className="space-y-4 text-muted-foreground">
          <h2 className="text-xl font-bold mb-3 text-foreground border-b border-muted pb-2">
              🟦 機能
          </h2>
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: 記録を間違えてタップしてしまいました。削除できますか？</h3>
            <p className="font-normal text-sm">
              A: Tap履歴を個別に編集・削除することはできません。データベースへの接続増加を伴うため、現時点では実装予定はありません。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: 追加招待券には対応しますか？</h3>
            <p className="font-normal text-sm">
              A: 今のところは対応していません。が、要望が多ければ検討します。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: Tap履歴のエクスポートはできますか？</h3>
            <p className="font-normal text-sm">
              A: テキストデータなどによるエクスポートは、今のところは対応していません。SNSなどへの共有は、月ごとの画像エクスポート機能をご使用ください。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: The history calendar doesn't match the dates I actually tapped.</h3>
            <p className="font-normal text-sm">
              A: The historical calendar considers the period from 4:00 AM to 3:59 AM the following day (Japan Standard Time) as one day. If you reside in a country using a time zone different from UTC+9, please understand this may not match the actual date you use.</p>
          </div>

          <h2 className="text-xl font-bold mb-3 text-foreground border-b border-muted pb-2">
              🟨 システム
          </h2>
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: オフラインでも利用できますか？</h3>
            <p className="font-normal text-sm">
              A: 利用できません。インターネットに接続が必要です。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: アプリを閉じてもタイマー・チケットは維持されますか？</h3>
            <p className="font-normal text-sm">
              A: はい、維持されます。時間はサーバー側に保存されているため、ブラウザを閉じたり、別の端末からアクセスしたりしても、最新の状態が反映されます。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: データのバックアップは必要ですか？</h3>
            <p className="font-normal text-sm">
              A: ログインに使用しているDiscordアカウントに紐づいてクラウド上に保存されるため、ログアウトしてもデータが消えることはありません。ただし、データの永久保存については保証しておりませんので、各自で別途記録しておくことをおすすめします。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: 複数の端末で同時に使えますか？</h3>
            <p className="font-normal text-sm">
              A: 可能ですが、データの整合性を保つために、他方の端末では再読み込みを行ってから操作を開始してください。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: 1つの端末で複数アカウントを管理できますか？</h3>
            <p className="font-normal text-sm">
              A: 可能ですが、本サイトはアカウントを切り替えて使うシステムを実装していませんので、都度ログアウト・ログインが必要となります。また、通知機能は端末ごとに管理されており、1つの端末につき1つのアカウントのみ通知を受信できますのでご了承ください。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: このサービスは無料で使えますか？</h3>
            <p className="font-normal text-sm">
              A: はい、すべての機能を無料でご利用いただけます。ただし、個人開発のサービスであるため、予告なく仕様変更やサービス停止を行う可能性がある点はあらかじめご了承ください。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: 通知が届きません。</h3>
            <p className="font-normal text-sm">
              A: ブラウザの設定で通知が「許可」になっているかご確認ください。また、本サイトの通知設定をやり直してみてください（使い方ガイドのページも参照）。ご利用の端末に起因する通知の不着は、申し訳ありませんが対応いたしかねます。利用規約にもある通り、通知は必ず届くことを保証しておりません。</p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground">
              Q: Discord以外のログイン方法はありますか？</h3>
            <p className="font-normal text-sm">
              A: 現在はDiscord認証のみに対応しています。本サイトはアカウントを切り替えて使用する設計になっていないため、他の認証システムを導入する予定もありません。</p>
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