import React, { useState } from 'react';
import { TapEntry } from '@/app/page';

interface HistoryCalendarProps {
  tapHistory: TapEntry[];
}

const HistoryCalendar: React.FC<HistoryCalendarProps> = ({ tapHistory }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const tapsByDate = tapHistory.reduce((acc, tap) => {
    const date = new Date(tap.timestamp).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(tap);
    return acc;
  }, {} as Record<string, TapEntry[]>);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const getTapColor = (tapCount: number) => {
    if (tapCount === 0) return 'bg-base-200';
    if (tapCount <= 2) return 'bg-primary/20';
    if (tapCount <= 4) return 'bg-primary/40';
    if (tapCount <= 6) return 'bg-primary/60';
    if (tapCount <= 8) return 'bg-primary/80';
    return 'bg-primary';
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="border p-2 text-center h-24"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day).toDateString();
    const taps = tapsByDate[date] || [];
    const bgColor = getTapColor(taps.length);
    calendarDays.push(
      <div key={day} className={`border p-2 text-center h-24 flex flex-col justify-between ${bgColor}`}>
        <div>{day}</div>
        <div className="text-xs">{taps.length} taps</div>
      </div>
    );
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Past Tap History</h1>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="btn">Prev</button>
        <div className="text-lg font-semibold">{year}年 {month + 1}月</div>
        <button onClick={() => changeMonth(1)} className="btn">Next</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <div key={d} className="text-center font-bold">{d}</div>
        ))}
        {calendarDays}
      </div>
    </div>
  );
};

export default HistoryCalendar;
