import { addHours, isAfter } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const JST_TZ = 'Asia/Tokyo';

export const getNextBoundary = (now: Date): Date => {
  const jstNow = toZonedTime(now, JST_TZ);
  const h = jstNow.getHours();

  let boundaryJst = new Date(jstNow);
  boundaryJst.setMinutes(0, 0, 0);

  if (h < 4) {
    boundaryJst.setHours(4);
  } else {
    boundaryJst.setDate(boundaryJst.getDate() + 1);
    boundaryJst.setHours(4);
  }

  return fromZonedTime(boundaryJst, JST_TZ);
};

export const getSessionEndTime = (lastTapTime: Date | null): Date | null => {
  if (!lastTapTime) return null;

  const standardEnd = addHours(lastTapTime, 3);
  const boundary = getNextBoundary(lastTapTime);

  if (isAfter(standardEnd, boundary)) {
    return boundary;
  }
  return standardEnd;
};

export const shouldScheduleNotification = (tapTime: Date): boolean => {
  const standardEnd = addHours(tapTime, 3);
  const boundary = getNextBoundary(tapTime);
  return !isAfter(standardEnd, boundary);
};