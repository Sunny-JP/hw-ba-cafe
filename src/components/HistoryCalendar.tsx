import React, { useState } from 'react';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const JST_TZ = 'Asia/Tokyo';

interface HistoryCalendarProps {
  tapHistory: number[];
}

const HistoryCalendar: React.FC<HistoryCalendarProps> = ({ tapHistory }) => {
  const [currentDate, setCurrentDate] = useState(() => toZonedTime(new Date(), JST_TZ));
  const getLogicalDateString = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hourJst = parseInt(formatInTimeZone(date, JST_TZ, 'H'), 10);
    const zonedDate = toZonedTime(date, JST_TZ);

    if (hourJst < 4) {
      zonedDate.setDate(zonedDate.getDate() - 1);
    }
    return formatInTimeZone(zonedDate, JST_TZ, 'yyyy-MM-dd');
  };

  const tapsByDate = (tapHistory || []).reduce((acc, tap) => {
    const dateString = getLogicalDateString(tap);
    if (!acc[dateString]) {
      acc[dateString] = [];
    }
    acc[dateString].push(tap);
    return acc;
  }, {} as Record<string, number[]>);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const getTapBgClass = (tapCount: number) => {
    if (tapCount === 0) return 'bg-tap-1';
    if (tapCount === 1) return 'bg-tap-2';
    if (tapCount === 2) return 'bg-tap-3';
    if (tapCount === 3) return 'bg-tap-4';
    if (tapCount === 4) return 'bg-tap-5';
    if (tapCount === 5) return 'bg-tap-6';
    if (tapCount === 6) return 'bg-tap-7';
    if (tapCount === 7) return 'bg-tap-8';
    return 'bg-tap-9';
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-2 aspect-square rounded-lg"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const dateStr = formatInTimeZone(cellDate, JST_TZ, 'yyyy-MM-dd');
    
    const taps = tapsByDate[dateStr] || [];
    const bgClass = getTapBgClass(taps.length);
    
    calendarDays.push(
      <div key={day} className={`relative p-2 aspect-square rounded-lg ${bgClass} cal-cell`}>
        <div className="absolute top-1 left-2 cal-days">{day}</div>
        <div className="absolute bottom-1 right-2 cal-tap">
          {taps.length > 0 ? taps.length : ''}
        </div>
      </div>
    );
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="cal-nav">Prev</button>
        <div className="cal-info">{year}年 {month + 1}月</div>
        <button onClick={() => changeMonth(1)} className="cal-nav">Next</button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <div key={d} className="text-center cal-week">{d}</div>
        ))}
        {calendarDays}
      </div>
    </div>
  );
};

export default HistoryCalendar;