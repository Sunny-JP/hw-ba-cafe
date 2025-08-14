"use client";

import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions, ChartData
} from 'chart.js';
import {
    isToday, isThisWeek, isThisMonth, isThisYear,
    getMonth,
    format, addMonths, subMonths, isSameMonth, isAfter,
    eachDayOfInterval, startOfMonth, endOfMonth,
    isSameDay,
    addYears, subYears, isSameYear, parseISO
} from 'date-fns';
import type { TapEntry } from '@/app/page';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

// 表示モードを「日別」と「月別」に変更
type ViewType = 'daily' | 'monthly';

interface StatsGraphProps {
  tapHistory: TapEntry[];
}

export default function StatsGraph({ tapHistory }: StatsGraphProps) {
  // デフォルトの表示を「日別」に変更
  const [view, setView] = useState<ViewType>('daily');
  const [displayDate, setDisplayDate] = useState(new Date());

  // --- サマリー統計データの計算 ---
  const weekOptions = { weekStartsOn: 1 as const };
  const allTapsToday = tapHistory.filter(t => isToday(parseISO(t.timestamp))).length;
  const oshiTapsToday = tapHistory.filter(t => t.isOshi && isToday(parseISO(t.timestamp))).length;

  const allTapsThisWeek = tapHistory.filter(t => isThisWeek(parseISO(t.timestamp), weekOptions)).length;
  const oshiTapsThisWeek = tapHistory.filter(t => t.isOshi && isThisWeek(parseISO(t.timestamp), weekOptions)).length;

  const allTapsThisMonth = tapHistory.filter(t => isThisMonth(parseISO(t.timestamp))).length;
  const oshiTapsThisMonth = tapHistory.filter(t => t.isOshi && isThisMonth(parseISO(t.timestamp))).length;

  const allTapsThisYear = tapHistory.filter(t => isThisYear(parseISO(t.timestamp))).length;
  const oshiTapsThisYear = tapHistory.filter(t => t.isOshi && isThisYear(parseISO(t.timestamp))).length;

  // --- 表示期間移動のハンドラ関数 ---
  const handlePrev = () => setDisplayDate(prev => view === 'daily' ? subMonths(prev, 1) : subYears(prev, 1));
  const handleNext = () => setDisplayDate(prev => view === 'daily' ? addMonths(prev, 1) : addYears(prev, 1));

  // 未来の期間には移動できないようにボタンを無効化
  const isNextDisabled = view === 'daily'
    ? isSameMonth(displayDate, new Date()) || isAfter(displayDate, new Date())
    : isSameYear(displayDate, new Date()) || isAfter(displayDate, new Date());


  // --- グラフ用データの準備 ---
  const { chartData, chartOptions, navLabel } = useMemo(() => {
    const commonOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { 
          position: 'top',
          labels: {
            color: '#999999'
          }
        } 
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 2,
            color: '#999999',
          },
        },
        x: {
          ticks: {
            color: '#999999',
          },
        },
      },
    };

    let navLabelText = '';
    let datasets: ChartData<'line'>['datasets'] = [];
    let labels: string[] = [];
    let titleText = '';

    if (view === 'daily') {
      navLabelText = format(displayDate, 'yyyy年 M月');
      titleText = `${navLabelText}の日別タップ数`;

      const monthStart = startOfMonth(displayDate);
      const monthEnd = endOfMonth(displayDate);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      labels = daysInMonth.map(day => format(day, 'd'));
      
      const dailyAllTaps = daysInMonth.map(day => 
        tapHistory.filter(t => isSameDay(parseISO(t.timestamp), day)).length
      );
      const dailyOshiTaps = daysInMonth.map(day => 
        tapHistory.filter(t => t.isOshi && isSameDay(parseISO(t.timestamp), day)).length
      );

      datasets = [
        { label: 'すべて', data: dailyAllTaps, borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)', tension: 0.1 },
        { label: '推し', data: dailyOshiTaps, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)', tension: 0.1 },
      ];

    } else { // view === 'monthly'
      navLabelText = format(displayDate, 'yyyy年');
      titleText = `${navLabelText}の月別タップ数`;

      const targetYearHistory = tapHistory.filter(t => isSameYear(parseISO(t.timestamp), displayDate));
      
      labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      const monthlyAllTaps = new Array(12).fill(0);
      const monthlyOshiTaps = new Array(12).fill(0);

      targetYearHistory.forEach(tap => {
        const month = getMonth(parseISO(tap.timestamp));
        monthlyAllTaps[month]++;
        if (tap.isOshi) monthlyOshiTaps[month]++;
      });

      datasets = [
        { label: 'すべて', data: monthlyAllTaps, borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)', tension: 0.1 },
        { label: '推し', data: monthlyOshiTaps, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)', tension: 0.1 },
      ];
    }
    
    return {
        chartData: { labels, datasets },
        chartOptions: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: false, text: titleText } } },
        navLabel: navLabelText
    };

  }, [tapHistory, view, displayDate]);

  return (
    <div className="space-y-6">
        {/* サマリー表示 */}
        <div>
            <h3 className="text-lg font-bold mb-2 text-foreground">サマリー</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-secondary rounded-lg">
                    <div className="text-sm text-muted-foreground">今日</div>
                    <div className="text-xl font-bold text-foreground">{allTapsToday} <span className="text-pink-600">({oshiTapsToday})</span></div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                    <div className="text-sm text-muted-foreground">今週</div>
                    <div className="text-xl font-bold text-foreground">{allTapsThisWeek} <span className="text-pink-600">({oshiTapsThisWeek})</span></div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                    <div className="text-sm text-muted-foreground">今月</div>
                    <div className="text-xl font-bold text-foreground">{allTapsThisMonth} <span className="text-pink-600">({oshiTapsThisMonth})</span></div>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                    <div className="text-sm text-muted-foreground">今年</div>
                    <div className="text-xl font-bold text-foreground">{allTapsThisYear} <span className="text-pink-600">({oshiTapsThisYear})</span></div>
                </div>
            </div>
        </div>

        {/* グラフ表示エリア */}
        <div>
            <h3 className="text-lg font-bold mb-2 text-foreground">タップ履歴グラフ</h3>
            <div className="my-4 flex justify-center gap-2">
                <button
                    onClick={() => setView('daily')}
                    className={`btn btn-outline ${view === 'daily' ? 'btn-outline-active' : ''}`}
                >
                    日別
                </button>
                <button
                    onClick={() => setView('monthly')}
                    className={`btn btn-outline ${view === 'monthly' ? 'btn-outline-active' : ''}`}
                >
                    月別
                </button>
            </div>

            {/* 期間移動ナビゲーション */}
            <div className="my-4 flex items-center justify-center gap-4">
                <button onClick={handlePrev} className="btn btn-ghost text-2xl">
                    &lt;
                </button>
                <span className="font-semibold text-lg w-32 text-center">
                    {navLabel}
                </span>
                <button
                    onClick={handleNext}
                    className="btn btn-ghost text-2xl"
                    disabled={isNextDisabled}
                >
                    &gt;
                </button>
            </div>

            {/* グラフ本体 */}
            <div className="relative" style={{ height: '300px' }}>
                <Line options={chartOptions} data={chartData} />
            </div>
        </div>
    </div>
  );
}