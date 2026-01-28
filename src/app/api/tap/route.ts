import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messages } from '@/lib/messages';
import { shouldScheduleNotification } from '@/lib/timeUtils';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tapTime, isPushEnabled, ticket1Time, ticket2Time } = body;
    const authHeader = request.headers.get('Authorization');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    if (!authHeader) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // --- DB更新処理 ---
    const upsertData: any = { 
      id: user.id, 
      updated_at: new Date().toISOString() 
    };

    if (isPushEnabled !== undefined) upsertData.is_push_enabled = isPushEnabled;
    
    if (ticket1Time) upsertData.ticket1_time = new Date(ticket1Time).toISOString();
    if (ticket2Time) upsertData.ticket2_time = new Date(ticket2Time).toISOString();

    if (tapTime) {
      const { data: profile } = await supabase.from('profiles').select('tap_history').eq('id', user.id).single();
      const newHistory = [...(profile?.tap_history || [])];
      
      const tapDate = new Date(tapTime);
      tapDate.setMilliseconds(0);
      newHistory.push(tapDate.toISOString());
      
      upsertData.tap_history = newHistory;
    }

    await supabase.from('profiles').upsert(upsertData);

    // --- 通知予約処理 ---
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