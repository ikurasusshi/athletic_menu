"use client";

import { useState, useEffect } from "react";
import { api, type TrainingSessionSummary, type TrainingSession } from "@/lib/api";

type DayMenu = {
  warmup: { duration: string; items: string[] } | null;
  main: { name: string; volume: string; rest: string; intensity: string }[];
  cooldown: { duration: string; items: string[] } | null;
  advice: string;
};

const DOW_HEADERS = ["日", "月", "火", "水", "木", "金", "土"];

const MOTIVATION_ICONS = ["😴", "😐", "🙂", "😊", "🔥"];
const COMMIT_ICONS = ["💤", "😑", "👍", "💪", "🏆"];

function parseMenu(raw: string): DayMenu | null {
  try {
    return JSON.parse(raw) as DayMenu;
  } catch {
    return null;
  }
}

function SessionDrawer({
  session,
  onClose,
}: {
  session: TrainingSession;
  onClose: () => void;
}) {
  const menu = parseMenu(session.generatedMenu);
  const date = new Date(session.createdAt);
  const label = `${date.getMonth() + 1}月${date.getDate()}日（${"日月火水木金土"[date.getDay()]}）`;

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="flex-1 bg-black/20" />
      <div
        className="w-full max-w-sm bg-white shadow-xl flex flex-col overflow-y-auto"
        style={{ animation: "slideIn 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">{label}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4">
          {/* Condition summary */}
          <div className="bg-gray-50 rounded-2xl p-4 flex gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400">モチベーション</span>
              <span className="text-xl">{MOTIVATION_ICONS[session.motivation - 1]}</span>
              <span className="text-xs font-semibold text-gray-700">{session.motivation}/5</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400">コミット度</span>
              <span className="text-xl">{COMMIT_ICONS[session.goalCommitment - 1]}</span>
              <span className="text-xs font-semibold text-gray-700">{session.goalCommitment}/5</span>
            </div>
          </div>

          {/* Generated menu */}
          {menu ? (
            <div className="space-y-3">
              {menu.warmup && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>🌱</span>
                    <span className="text-xs font-semibold text-green-800">ウォームアップ</span>
                    <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{menu.warmup.duration}</span>
                  </div>
                  <ul className="space-y-1">
                    {menu.warmup.items.map((item, i) => (
                      <li key={i} className="text-xs text-green-900 flex gap-1.5"><span className="text-green-400">•</span>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {menu.main.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>⚡</span>
                    <span className="text-xs font-semibold text-blue-800">メインメニュー</span>
                  </div>
                  <div className="space-y-2">
                    {menu.main.map((item, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 border border-blue-100">
                        <p className="text-xs font-semibold text-gray-900 mb-1.5">{item.name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{item.volume}</span>
                          <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.rest}</span>
                          <span className="text-[11px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{item.intensity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {menu.cooldown && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>🌙</span>
                    <span className="text-xs font-semibold text-purple-800">クールダウン</span>
                    <span className="ml-auto text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{menu.cooldown.duration}</span>
                  </div>
                  <ul className="space-y-1">
                    {menu.cooldown.items.map((item, i) => (
                      <li key={i} className="text-xs text-purple-900 flex gap-1.5"><span className="text-purple-400">•</span>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {menu.advice && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span>💡</span>
                    <span className="text-xs font-semibold text-amber-800">アドバイス</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">{menu.advice}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">メニューデータがありません</p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default function HistoryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summaries, setSummaries] = useState<TrainingSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.sessions.list().then(setSummaries).finally(() => setLoading(false));
  }, []);

  // Filter summaries for current month
  const monthSummaries = summaries.filter((s) => {
    const d = new Date(s.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  // Map "YYYY-MM-DD" → session
  const sessionMap = new Map<string, TrainingSessionSummary>();
  for (const s of monthSummaries) {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    sessionMap.set(key, s);
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const cells: Date[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) {
    cells.push(new Date(year, month - 1, -firstDay.getDay() + i + 1));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month - 1, d));
  }
  while (cells.length % 7 !== 0) {
    cells.push(new Date(year, month, cells.length - lastDay.getDate() - firstDay.getDay() + 1));
  }

  async function handleDayClick(date: Date, sessionId: string) {
    setLoadingDetail(true);
    try {
      const detail = await api.sessions.get(sessionId);
      setSelectedSession(detail);
    } finally {
      setLoadingDetail(false);
    }
  }

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const today = now;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">トレーニング記録</h1>
        <p className="text-sm text-gray-500 mt-0.5">過去のメニューをカレンダーで確認</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        {/* Month navigator */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-50 text-gray-500 transition text-lg">‹</button>
          <span className="text-base font-semibold text-gray-900">{year}年 {month}月</span>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-50 text-gray-500 transition text-lg">›</button>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DOW_HEADERS.map((h, i) => (
            <div key={h} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
              {h}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400 mr-2" />
            読み込み中...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              const isCurrentMonth = date.getMonth() === month - 1;
              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const session = sessionMap.get(dateStr);
              const isToday =
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate();
              const dow = date.getDay();

              return (
                <button
                  key={i}
                  disabled={!isCurrentMonth || !session}
                  onClick={() => session && handleDayClick(date, session.id)}
                  className={`relative flex flex-col items-center pt-2 pb-1.5 rounded-xl border transition-all min-h-[60px] ${
                    session && isCurrentMonth
                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer"
                      : "bg-white border-gray-100"
                  } ${isToday ? "ring-1 ring-blue-300 border-blue-400" : ""} ${
                    !isCurrentMonth ? "opacity-30 cursor-default" : ""
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      isToday
                        ? "text-blue-600"
                        : dow === 0
                        ? "text-red-500"
                        : dow === 6
                        ? "text-blue-500"
                        : isCurrentMonth
                        ? "text-gray-800"
                        : "text-gray-300"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {session && isCurrentMonth && (
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-blue-500 mx-auto" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend & stats */}
        {!loading && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> トレーニング実施
            </div>
            <span className="ml-auto text-xs text-gray-400">
              今月 {monthSummaries.length} 回
            </span>
          </div>
        )}
      </div>

      {/* Loading overlay for detail */}
      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-blue-500" />
        </div>
      )}

      {/* Session detail drawer */}
      {selectedSession && (
        <SessionDrawer session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}
