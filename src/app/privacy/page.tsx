import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-muted">
        <h1 className="text-3xl font-bold mb-6 text-foreground">プライバシーポリシー</h1>
        
        <div className="space-y-4 font-normal text-sm">
          <p>当サイト（以下、「当方」）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」）を定めます。</p>

          <h3 className="font-bold text-foreground mt-4">1. 収集する情報</h3>
          <ul className="list-disc pl-5">
            <li><b>認証情報</b>: Discordログイン時に提供されるユーザーID、メールアドレス、プロフィール画像。これらはユーザーの識別とデータ保存のためにのみ使用されます。</li>
            <li><b>利用データ</b>: タイマーのタップ履歴、設定情報。</li>
            <li><b>通知トークン</b>: プッシュ通知を送信するために必要なトークン。</li>
          </ul>

          <h3 className="font-bold text-foreground mt-4">2. 利用目的</h3>
          <ul className="list-disc pl-5">
            <li>本サービスの提供・運営のため</li>
            <li>通知機能の提供のため</li>
            <li>不正アクセスの防止のため</li>
          </ul>

          <h3 className="font-bold text-foreground mt-4">3. 第三者への提供</h3>
          <p>当方は、法令に基づく場合を除き、予めユーザーの同意を得ることなく第三者に個人情報を提供することはありません。ただし、本サービスの基盤としてSupabaseを使用しており、データはSupabaseのサーバー上で管理されます。</p>

          <h3 className="font-bold text-foreground mt-4">4. データの削除</h3>
          <p>ユーザーは設定画面の「データ削除」ボタンから、いつでも自身の全データをサーバーから完全に削除することができます。</p>
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