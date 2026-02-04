import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messages } from '@/lib/messages';
import { shouldScheduleNotification } from '@/lib/timeUtils';

export const runtime = 'edge';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://rabbit1.cc',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // tapTime（通知・履歴用）とチケット時間を取得
    const { tapTime, ticket1Time, ticket2Time } = body;
    const authHeader = request.headers.get('Authorization');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    if (!authHeader) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // --- 1. 重複タップ防止ロジック (tapsテーブルから最新レコードを確認) ---
    if (tapTime) {
      const { data: lastTap } = await supabase
        .from('taps')
        .select('tap_time')
        .eq('user_id', user.id)
        .order('tap_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastTap) {
        const lastTapDate = new Date(lastTap.tap_time);
        const currentTapDate = new Date(tapTime);
        const diffMs = currentTapDate.getTime() - lastTapDate.getTime();

        // 1時間以内の同一時間枠タップをチェック
        if (diffMs < 3600000) { 
          if (shouldScheduleNotification(lastTapDate) === shouldScheduleNotification(currentTapDate)) {
            return NextResponse.json({ error: 'Duplicate tap within 1 hour' }, { status: 429 });
          }
        }
      }
      
      // 重複でなければ新テーブルにインサート
      await supabase.from('taps').insert([{ user_id: user.id, tap_time: new Date(tapTime).toISOString() }]);
    }

    // --- 2. profilesテーブルの更新 (チケット時間のみ) ---
    const upsertData: any = { 
      id: user.id, 
      updated_at: new Date().toISOString() 
    };

    if (ticket1Time !== undefined) upsertData.ticket1_time = ticket1Time ? new Date(ticket1Time).toISOString() : null;
    if (ticket2Time !== undefined) upsertData.ticket2_time = ticket2Time ? new Date(ticket2Time).toISOString() : null;

    // tap_historyカラムへの書き込みは行わない（profilesを軽量に保つ）
    await supabase.from('profiles').upsert(upsertData);

    // --- 3. 通知予約処理 ---
    if (tapTime && shouldScheduleNotification(new Date(tapTime))) {
      const sendAfter = new Date(tapTime);
      sendAfter.setSeconds(0, 0); 
      sendAfter.setHours(sendAfter.getHours() + 3);

      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          include_aliases: { external_id: [user.id] },
          target_channel: "push",
          contents: { en: randomMsg.body, ja: randomMsg.body },
          headings: { en: randomMsg.title, ja: randomMsg.title },
          send_after: sendAfter.toISOString(), 
        })
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}