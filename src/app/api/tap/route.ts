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

    // --- 1. 重複タップ防止ロジック ---
    if (tapTime) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tap_history')
        .eq('id', user.id)
        .single();
      
      const history = profile?.tap_history || [];
      if (history.length > 0) {
        const lastTapDate = new Date(history[history.length - 1]);
        const currentTapDate = new Date(tapTime);
        const diffMs = currentTapDate.getTime() - lastTapDate.getTime();

        // 1時間以内の連続タップをチェック
        if (diffMs < 3600000) { 
          const lastShouldNotify = shouldScheduleNotification(lastTapDate);
          const currentShouldNotify = shouldScheduleNotification(currentTapDate);

          // 通知予約の判定（送る/送らない）が同じ時間枠なら、重複として拒否
          if (lastShouldNotify === currentShouldNotify) {
            return NextResponse.json({ error: 'Duplicate tap within 1 hour' }, { status: 429 });
          }
        }
      }
    }

    // --- 2. DB更新データの作成 ---
    const upsertData: any = { 
      id: user.id, 
      updated_at: new Date().toISOString() 
    };

    if (ticket1Time !== undefined) upsertData.ticket1_time = ticket1Time ? new Date(ticket1Time).toISOString() : null;
    if (ticket2Time !== undefined) upsertData.ticket2_time = ticket2Time ? new Date(ticket2Time).toISOString() : null;

    let newHistory: string[] = [];
    if (tapTime) {
      const { data: profile } = await supabase.from('profiles').select('tap_history').eq('id', user.id).single();
      newHistory = [...(profile?.tap_history || [])];
      
      const tapDate = new Date(tapTime);
      tapDate.setMilliseconds(0);
      newHistory.push(tapDate.toISOString());
      
      upsertData.tap_history = newHistory;
    }

    await supabase.from('profiles').upsert(upsertData);

    // --- 3. 通知予約処理 ---
    if (tapTime && shouldScheduleNotification(new Date(tapTime))) {
      const sendAfter = new Date(tapTime);
      sendAfter.setSeconds(0, 0); 
      sendAfter.setHours(sendAfter.getHours() + 3);

      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      
      const osResponse = await fetch("https://onesignal.com/api/v1/notifications", {
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

      if (!osResponse.ok) {
        const errorMsg = await osResponse.text();
        console.error("OneSignal API Error:", errorMsg);
      }
    }

    return NextResponse.json({ success: true, history: newHistory });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}