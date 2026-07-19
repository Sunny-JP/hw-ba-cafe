"use client";

import { useState, useEffect } from 'react';
import { UPDATE_LOGS } from '@/lib/updateLogs';

export default function NewFeatureDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const latestLog = UPDATE_LOGS[0];
  const pastLogs = UPDATE_LOGS.slice(1);
  
  const latestLogId = latestLog ? `${latestLog.date}_${latestLog.content}` : 'initial';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastNotifiedId = localStorage.getItem('new_feature_notified_id');
      if (lastNotifiedId !== latestLogId) {
        setIsOpen(true);
      }
    }
  }, [latestLogId]);

  const handleClose = () => {
    if (isChecked) {
      localStorage.setItem('new_feature_notified_id', latestLogId);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-100 flex justify-center items-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl shadow-xl border border-dashed bg-(--card) border-(--muted) flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="border-b border-dashed flex justify-between items-center p-5">
          <h2 className="text-xl font-bold text-(--foreground) tracking-wide flex items-center gap-2">
            アップデートのお知らせ
          </h2>
        </div>

        <div className=" flex flex-col text-sm font-medium leading-relaxed text-(--secondary-foreground)">
          
          {/* 1. 最新の更新履歴とコメント（上部に大きく配置） */}
          {latestLog && (
            <div className="bg-(--background) p-4 border border-dashed border-(--primary)/30 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-s font-bold text-(--secondary-foreground)">
                <span>{latestLog.date}</span>
              </div>
              <strong className="text-base font-bold text-(--foreground) block">
                {latestLog.content}
              </strong>
              {latestLog.comment && (
                <p className="text-sm text-(--secondary-foreground) font-medium">
                  {latestLog.comment}
                </p>
              )}
            </div>
          )}
          
          {/* 2. それ以前の更新履歴（下部にリスト表示） */}
          {pastLogs.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="show-scrollbar bg-(--background) p-4 border border-dashed border-(--muted)/60 flex flex-col gap-2.5 max-h-36 overflow-y-auto">
                {pastLogs.map((log, index) => (
                  <div key={index} className="flex flex-col gap-0.5 text-xs">
                    <div className="flex gap-3">
                      <span className="shrink-0 font-bold text-(--muted-foreground)">{log.date}</span>
                      <p className="text-(--secondary-foreground)">{log.content}</p>
                    </div>
                    {log.comment && (
                      <p className="text-[11px] text-(--secondary-foreground)/70 pl-18.5 leading-normal">
                        {log.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-(--background)/50 border-t border-dashed border-(--muted)/40 flex flex-col gap-3">
          <label className="flex items-center gap-2 px-1 cursor-pointer select-none text-xs text-(--secondary-foreground) font-bold">
            <input 
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-4 h-4 rounded border-(--muted) text-(--primary) focus:ring-(--primary) cursor-pointer"
            />
            <span>今回のアップデートノートを今後表示しない</span>
          </label>

          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl font-bold bg-(--primary) text-(--primary-foreground) transition-all active:scale-98 cursor-pointer shadow-sm hover:brightness-105"
          >
            OK
          </button>
        </div>

      </div>
    </div>
  );
}