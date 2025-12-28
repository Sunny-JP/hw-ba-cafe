import { addHours, setHours, setMinutes, setSeconds, setMilliseconds, isAfter, addDays } from 'date-fns';

/**
 * 指定された時刻(now)に基づき、次の4:00または16:00の境界時刻を返す
 * (端末のローカル時間を基準とします)
 */
export const getNextBoundary = (now: Date): Date => {
  const h = now.getHours();
  let boundary = new Date(now);
  
  // 秒・ミリ秒を0にリセット
  boundary = setMinutes(setSeconds(setMilliseconds(boundary, 0), 0), 0);

  if (h < 4) {
    // 0:00 ~ 3:59 -> 当日の4:00
    boundary = setHours(boundary, 4);
  } else if (h < 16) {
    // 4:00 ~ 15:59 -> 当日の16:00
    boundary = setHours(boundary, 16);
  } else {
    // 16:00 ~ 23:59 -> 翌日の4:00
    boundary = addDays(setHours(boundary, 4), 1);
  }
  return boundary;
};

/**
 * 最後のタップ時刻から、有効な終了時刻（Session End）を計算する
 * ルール: 基本3時間後。ただし次の4:00/16:00を超える場合はそこで打ち切り。
 */
export const getSessionEndTime = (lastTapTime: Date | null): Date | null => {
  if (!lastTapTime) return null;

  const standardEnd = addHours(lastTapTime, 3);
  const boundary = getNextBoundary(lastTapTime);

  // 3時間後が境界を超えているか？
  if (isAfter(standardEnd, boundary)) {
    return boundary; // 境界で強制終了
  }
  return standardEnd; // 通常通り3時間後
};

/**
 * 通知を送るべきかどうか判定する
 */
export const shouldScheduleNotification = (tapTime: Date): boolean => {
  const standardEnd = addHours(tapTime, 3);
  const boundary = getNextBoundary(tapTime);
  return !isAfter(standardEnd, boundary);
};