import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messages } from '@/lib/messages';
import { shouldScheduleNotification } from '@/lib/timeUtils';

export const runtime = 'edge';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

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
      await cleanupOldDevices(user.id);
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
      await cleanupOldDevices(user.id);
      await scheduleNotification(user.id, tapTime);
    }
    return NextResponse.json({ success: true, history: newHistory });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function cleanupOldDevices(userId: string) {
  try {
    const res = await fetch(
      `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users/by/external_id/${userId}`,
      {
        headers: { 
          "Authorization": `Basic ${ONESIGNAL_REST_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (!res.ok) {
      console.error("OneSignal User Fetch Failed:", await res.text());
      return;
    }
    const userData = await res.json();
    const subscriptions = userData.subscriptions || [];
    const allPushSubs = subscriptions
      .filter((s: any) => s.type === "Push")
      .sort((a: any, b: any) => {
        const dateA = new Date(a.last_active || a.created_at || 0).getTime();
        const dateB = new Date(b.last_active || b.created_at || 0).getTime();
        return dateB - dateA;
      });
    if (allPushSubs.length > 2) {
      const toDelete = allPushSubs.slice(2);
      console.log(`Deleting ${toDelete.length} old subscriptions for user: ${userId}`);
      for (const sub of toDelete) {
        const delRes = await fetch(
          `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/subscriptions/${sub.id}`,
          {
            method: "DELETE",
            headers: { 
              "Authorization": `Basic ${ONESIGNAL_REST_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );
        if (!delRes.ok) {
          console.error(`Failed to delete subscription ${sub.id}:`, await delRes.text());
        }
      }
    }
  } catch (e) {
    console.error("OneSignal Cleanup Critical Error:", e);
  }
}

async function scheduleNotification(userId: string, tapTime: string) {
  const sendAfter = new Date(tapTime);
  sendAfter.setHours(sendAfter.getHours() + 3);
  const msg = messages[Math.floor(Math.random() * messages.length)] || { title: "Cafe Timer", body: "カフェ業務の時間です" };
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${ONESIGNAL_REST_KEY}`
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [userId] },
      target_channel: "push",
      contents: { en: msg.body, ja: msg.body },
      headings: { en: msg.title, ja: msg.title },
      send_after: sendAfter.toISOString(),
    })
  });
  if (!res.ok) console.error("Notification Error:", await res.text());
}