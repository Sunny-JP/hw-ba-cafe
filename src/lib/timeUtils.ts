import { addHours, isAfter, startOfHour, setHours, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const JST_TZ = 'Asia/Tokyo';

// カレンダーの移動制限範囲（運用開始月～現在の月）
export const CALENDAR_LIMITS = {
  MIN: new Date(2025, 12, 1),
  MAX: new Date(),
} as const;

// 境界線（4時/16時）を求める
export const getNextBoundary = (date: Date): Date => {
  const jst = toZonedTime(date, JST_TZ);
  const hour = jst.getHours();

  let boundary = startOfHour(jst);
  if (hour < 4) {
    boundary = setHours(boundary, 4);
  } else if (hour < 16) {
    boundary = setHours(boundary, 16);
  } else {
    boundary = setHours(addDays(boundary, 1), 4);
  }
  return fromZonedTime(boundary, JST_TZ);
};

// UI表示用の終了時刻計算 (3時間後 or 境界線の早い方)
export const getSessionEndTime = (lastTapTime: Date | null): Date | null => {
  if (!lastTapTime) return null;

  const baseTime = new Date(lastTapTime);
  baseTime.setMilliseconds(0);

  const standardEnd = addHours(baseTime, 3);
  const boundary = getNextBoundary(baseTime);

  return isAfter(standardEnd, boundary) ? boundary : standardEnd;
};

// 通知を予約すべきか判定
export const shouldScheduleNotification = (tapTime: Date): boolean => {
  const jst = toZonedTime(tapTime, JST_TZ);
  const h = jst.getHours();
  
  if ((h >= 1 && h < 4) || (h >= 13 && h < 16)) return false;

  const endTime = getSessionEndTime(tapTime);
  if (!endTime) return false;

  const standardEnd = addHours(tapTime, 3);
  standardEnd.setMilliseconds(0);

  return endTime.getTime() === standardEnd.getTime();
};