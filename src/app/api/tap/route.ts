import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messages } from '@/lib/messages';
import { shouldScheduleNotification } from '@/lib/timeUtils';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tapTime, isPushEnabled, onesignalId, ticket1Time, ticket2Time } = body;
    const authHeader = request.headers.get('Authorization');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    if (!authHeader) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // --- 1. DB更新用データの構築 ---
    const upsertData: any = { 
      id: user.id, 
      updated_at: new Date().toISOString() 
    };

    if (isPushEnabled !== undefined) {
      upsertData.is_push_enabled = Boolean(isPushEnabled);
    }
    
    if (onesignalId) {
      upsertData.onesignal_id = onesignalId;
    }

    if (ticket1Time !== undefined) upsertData.ticket1_time = ticket1Time ? new Date(ticket1Time).toISOString() : null;
    if (ticket2Time !== undefined) upsertData.ticket2_time = ticket2Time ? new Date(ticket2Time).toISOString() : null;

    if (tapTime) {
      const { data: profile } = await supabase.from('profiles').select('tap_history').eq('id', user.id).single();
      const newHistory = [...(profile?.tap_history || [])];
      
      const tapDate = new Date(tapTime);
      tapDate.setMilliseconds(0);
      newHistory.push(tapDate.toISOString());
      
      upsertData.tap_history = newHistory;
    }

    // DBへの書き込みを実行
    await supabase.from('profiles').upsert(upsertData);

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('is_push_enabled')
      .eq('id', user.id)
      .single();

    if (tapTime && currentProfile?.is_push_enabled && shouldScheduleNotification(new Date(tapTime))) {
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}