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

    console.log(`[Debug] Start process for user: ${user.id}`);

    // 通知ボタンまたはタップ時に ID があればクリーンアップを実行
    // 現在のデバイスID (onesignalId) を渡して保護する
    if (onesignalId) {
      console.log(`[Cleanup] Triggered by ID: ${onesignalId}`);
      await cleanupDevices(user.id, onesignalId);
    }

    // DB更新処理
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

    // 通知スケジュール
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
  console.log(`[Cleanup] Fetching subscriptions for ${userId}...`);
  try {
    const res = await fetch(`https://onesignal.com/api/v1/apps/${APP_ID}/users/by/external_id/${userId}`, {
      headers: { 
        "Authorization": `Basic ${API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!res.ok) {
      console.error(`[Cleanup] Fetch failed: ${res.status}`);
      return;
    }

    const data = await res.json();
    const subscriptions = data.subscriptions || (data.identity && data.identity.subscriptions) || [];
    
    // Push通知端末を全て抽出
    const pushSubs = subscriptions.filter((s: any) => {
      const typeStr = String(s.type);
      return typeStr.includes("Push") || typeStr === "1";
    });

    // 今操作しているデバイスをリストから除外して保護
    const otherDevices = pushSubs.filter((s: any) => s.id !== currentId);
    
    console.log(`[Cleanup] Keeping Current: ${currentId}. Others count: ${otherDevices.length}`);

    // 他のデバイスをアクティブ順（または作成順）にソート
    otherDevices.sort((a: any, b: any) => {
      const timeA = Number(a.last_active || a.created_at || 0);
      const timeB = Number(b.last_active || b.created_at || 0);
      return timeB - timeA;
    });

    // 全体で3台以上（自分 + 他2台以上）ある場合、他の中で最新の1台以外を削除
    if (pushSubs.length > 2) {
      const targets = otherDevices.slice(1);
      console.log(`[Cleanup] Target for deletion: ${targets.length} old devices.`);

      for (const sub of targets) {
        console.log(`[Cleanup] Deleting sub_id: ${sub.id}`);
        await fetch(`https://onesignal.com/api/v1/apps/${APP_ID}/subscriptions/${sub.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Basic ${API_KEY}` }
        });
      }
    } else {
      console.log(`[Cleanup] Within limit (Total: ${pushSubs.length})`);
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