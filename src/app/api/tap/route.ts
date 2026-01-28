import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messages } from '@/lib/messages';
import { shouldScheduleNotification } from '@/lib/timeUtils';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tapTime, onesignalId, ticket1Time, ticket2Time } = body;
    const authHeader = request.headers.get('Authorization');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader ?? '',
          },
        },
      }
    );

    if (!authHeader) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

// --- DB更新処理 ---
    const { data: profile } = await supabase.from('profiles').select('tap_history').eq('id', user.id).single();
    let newHistory = [...(profile?.tap_history || [])];
    if (tapTime) newHistory.push(tapTime);

    const upsertData: any = { id: user.id, updated_at: new Date().toISOString() };
    if (tapTime) upsertData.tap_history = newHistory;
    // onesignalIdが空で送られてきた場合に既存のIDを消さないように制御
    if (onesignalId) upsertData.onesignal_id = onesignalId;
    
    if (ticket1Time !== undefined) upsertData.ticket1_time = ticket1Time ? new Date(ticket1Time).toISOString() : null;
    if (ticket2Time !== undefined) upsertData.ticket2_time = ticket2Time ? new Date(ticket2Time).toISOString() : null;

    await supabase.from('profiles').upsert(upsertData);

    // --- 通知予約処理 ---
    if (tapTime && shouldScheduleNotification(new Date(tapTime))) {
      const sendAfter = new Date(tapTime);
      sendAfter.setHours(sendAfter.getHours() + 3);

      const randomMsg = messages 
        ? messages[Math.floor(Math.random() * messages.length)]
        : { title: "Cafe Timer", body: "カフェ業務の時間です" };
      
      const notificationPayload = {
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        // Subscription IDではなく External ID (user.id) で送る
        // これにより、OneSignal側で複数のデバイスが紐付いていても全てに届く
        include_aliases: { 
          external_id: [user.id] 
        },
        target_channel: "push",
        contents: { en: randomMsg.body, ja: randomMsg.body },
        headings: { en: randomMsg.title, ja: randomMsg.title },
        send_after: sendAfter.toISOString(), 
      };

      const osRes = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify(notificationPayload)
      });
      
      if (!osRes.ok) {
          const errorDetail = await osRes.text();
          console.error("OneSignal API Error:", errorDetail);
      }
    }

    return NextResponse.json({ success: true, history: newHistory });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}