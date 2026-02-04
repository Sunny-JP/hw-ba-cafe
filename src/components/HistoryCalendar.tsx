import React, { useState, useRef, useEffect } from 'react';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { toPng } from 'html-to-image';

const JST_TZ = 'Asia/Tokyo';
const SITE_NAME = "My Tap History  by  Cafe Timer";
const SITE_URL = "https://cafetimer.rabbit1.cc";

interface HistoryCalendarProps {
  tapHistory: number[];
  onMonthChange: (year: number, month: number) => void;
}

const HistoryCalendar: React.FC<HistoryCalendarProps> = ({ tapHistory, onMonthChange }) => {
  const [currentDate, setCurrentDate] = useState(() => toZonedTime(new Date(), JST_TZ));
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMonthChange(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate, onMonthChange]);

  const getLogicalDateString = (timestamp: number): string => {
    const adjustedTime = timestamp - 4 * 60 * 60 * 1000;
    return formatInTimeZone(adjustedTime, JST_TZ, 'yyyy-MM-dd');
  };

  const tapsByDate = (tapHistory || []).reduce((acc, tap) => {
    const dateString = getLogicalDateString(tap);
    if (!acc[dateString]) acc[dateString] = [];
    acc[dateString].push(tap);
    return acc;
  }, {} as Record<string, number[]>);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startDay = (firstDayIndex + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleExportImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const dataUrl = await toPng(exportRef.current, {
        canvasWidth: 1440,
        canvasHeight: 1440,
        width: 1440,
        height: 1440,
        style: { transform: 'none' },
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `History-${year}-${month + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-2 aspect-square"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const taps = tapsByDate[dateKey] || [];
    calendarDays.push(
      <div key={day} className={`relative p-2 aspect-square rounded-sm cal-cell ${isExporting ? 'export-cell' : ''} ${taps.length === 0 ? 'bg-tap-0' : `bg-tap-${Math.min(taps.length, 8)}`}`}>
        <div className={`absolute top-1 left-2 cal-days ${isExporting ? 'export-text-days' : ''}`}>{day}</div>
        <div className={`absolute bottom-1 right-2 cal-tap ${isExporting ? 'export-text-taps' : ''}`}>
          {taps.length > 0 ? taps.length : ''}
        </div>
      </div>
    );
  }

  return (
    <div className="cal-container">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => changeMonth(-1)} className="cal-nav">Prev</button>
        <div className="flex flex-col items-center">
          <div className="cal-info">{year}. {month + 1}</div>
          <button onClick={handleExportImage} className="cal-save-nav uppercase tracking-widest">
            Save Image
          </button>
        </div>
        <button onClick={() => changeMonth(1)} className="cal-nav">Next</button>
      </div>

      <div ref={exportRef} className={`bg-(--background) ${isExporting ? 'export-container' : 'w-full rounded-2xl'}`}>
        {isExporting && <div className="export-header">{year} / {String(month + 1).padStart(2, '0')}</div>}
        <div className={`grid grid-cols-7 ${isExporting ? 'export-grid' : 'gap-2'}`}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className={`text-center font-bold cal-week ${isExporting ? 'export-week' : 'text-xl pb-4'}`}>{d}</div>
          ))}
          {calendarDays}
        </div>
        {isExporting && (
          <div className="export-footer">
            <div className="export-site-name">{SITE_NAME}</div>
            <div className="export-site-url">{SITE_URL}</div>
          </div>
        )}
      </div>

      <style jsx>{`
        .export-container { position: fixed; top: 0; left: 0; width: 1440px; height: 1440px; display: flex; flex-direction: column; justify-content: space-between; padding: 80px 100px; z-index: -100; }
        .export-header { font-size: 100px !important; font-weight: 800; text-align: center; margin-bottom: 20px; }
        .export-grid { gap: 20px !important; }
        .export-week { font-size: 32px !important; opacity: 0.6; }
        :global(.export-text-days) { font-size: 50px !important; line-height: 1 !important; left: 15px !important; top: 15px !important; }
        :global(.export-text-taps) { font-size: 70px !important; line-height: 1 !important; font-weight: 700 !important; right: 20px !important; bottom: 20px !important; }
        .export-footer { text-align: center; opacity: 0.5; margin-top: 30px; }
        .export-site-name { font-size: 38px; font-weight: 700; }
        .export-site-url { font-size: 24px; }
      `}</style>
    </div>
  );
};

export default HistoryCalendar;