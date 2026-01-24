import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messages } from '@/lib/messages';
import { shouldScheduleNotification } from '@/lib/timeUtils';

export const runtime = 'edge';

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const API_KEY = process.env.ONESIGNAL_REST_API_KEY;

export async function POST(request: Request) {
  try {
    const { tapTime, onesignalId, ticket1Time, ticket2Time } = await request.json();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No token' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (onesignalId) {
      await cleanupDevices(user.id, onesignalId);
    }

    const { data: profile } = await supabase.from('profiles').select('tap_history').eq('id', user.id).single();
    const newHistory = tapTime ? [...(profile?.tap_history || []), tapTime] : (profile?.tap_history || []);

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      updated_at: new Date().toISOString(),
      tap_history: newHistory,
      onesignal_id: onesignalId || undefined,
      ticket1_time: ticket1Time ? new Date(ticket1Time).toISOString() : (ticket1Time === null ? null : undefined),
      ticket2_time: ticket2Time ? new Date(ticket2Time).toISOString() : (ticket2Time === null ? null : undefined),
    });

    if (upsertError) throw new Error(upsertError.message);

    if (tapTime && shouldScheduleNotification(new Date(tapTime))) {
      await scheduleNotification(user.id, tapTime);
    }

    return NextResponse.json({ success: true, history: newHistory });
  } catch (error: any) {
    console.error("[Error] Critical API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function cleanupDevices(userId: string, currentId: string) {
  try {
    const res = await fetch(`https://onesignal.com/api/v1/apps/${APP_ID}/users/by/external_id/${userId}`, {
      headers: { "Authorization": `Basic ${API_KEY}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    const subs = data.subscriptions || (data.identity && data.identity.subscriptions) || [];
    
    const pushSubs = subs.filter((s: any) => String(s.type).includes("Push") || String(s.type) === "1");
    const otherDevices = pushSubs.filter((s: any) => s.id !== currentId);

    otherDevices.sort((a: any, b: any) => {
      const timeA = Number(a.last_active || a.created_at || 0);
      const timeB = Number(b.last_active || b.created_at || 0);
      return timeB - timeA;
    });

    if (pushSubs.length > 2) {
      const toDelete = otherDevices.slice(1);
      for (const sub of toDelete) {
        await fetch(`https://onesignal.com/api/v1/apps/${APP_ID}/subscriptions/${sub.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Basic ${API_KEY}` }
        });
      }
    }
  } catch (e) {
    console.error("[Cleanup] Error:", e);
  }
}

async function scheduleNotification(userId: string, tapTime: string) {
  const sendAfter = new Date(tapTime);
  sendAfter.setHours(sendAfter.getHours() + 3);
  const msg = messages[Math.floor(Math.random() * messages.length)] || { title: "Cafe Timer", body: "カフェ業務の時間です" };

  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${API_KEY}`
    },
    body: JSON.stringify({
      app_id: APP_ID,
      include_aliases: { external_id: [userId] },
      target_channel: "push",
      contents: { en: msg.body, ja: msg.body },
      headings: { en: msg.title, ja: msg.title },
      send_after: sendAfter.toISOString(),
    })
  });
}