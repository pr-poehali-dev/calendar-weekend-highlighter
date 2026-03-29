import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface CycleSettings {
  workDays: number;
  restDays: number;
  startDate: string;
  startDayType: "work" | "rest";
}

interface Notification {
  id: string;
  message: string;
  type: "warning" | "info";
  date: string;
}

interface DayEvent {
  dateKey: string; // "YYYY-MM-DD"
  label: string;
  emoji: string;
  color: string;
}

type DayType = "work" | "rest" | "today-work" | "today-rest";

interface DayInfo {
  date: Date;
  type: DayType;
  dayInCycle: number;
  cyclePhase: "work" | "rest";
}

const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const MONTHS_RU_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

const DAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const EMOJI_OPTIONS = ["🎉", "🎂", "⭐", "🏖️", "💼", "🏥", "✈️", "🎓", "❤️", "🔔", "🏠", "⚡"];
const COLOR_OPTIONS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"];

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDayInfo(date: Date, settings: CycleSettings): DayInfo {
  const start = new Date(settings.startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const cycleLen = settings.workDays + settings.restDays;

  const dayInCycle = ((diffDays % cycleLen) + cycleLen) % cycleLen;

  const isRestPhase =
    settings.startDayType === "work"
      ? dayInCycle >= settings.workDays
      : dayInCycle < settings.restDays;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = target.getTime() === today.getTime();

  const cyclePhase: "work" | "rest" = isRestPhase ? "rest" : "work";
  let type: DayType = cyclePhase;
  if (isToday) type = cyclePhase === "work" ? "today-work" : "today-rest";

  return { date, type, dayInCycle, cyclePhase };
}

function getMonthDays(year: number, month: number, settings: CycleSettings): (DayInfo | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const days: (DayInfo | null)[] = [];

  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(getDayInfo(new Date(year, month, d), settings));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function getYearStats(year: number, settings: CycleSettings) {
  let work = 0, rest = 0;
  for (let m = 0; m < 12; m++) {
    const days = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const info = getDayInfo(new Date(year, m, d), settings);
      if (info.cyclePhase === "work") work++;
      else rest++;
    }
  }
  return { work, rest };
}

function getMonthStats(year: number, month: number, settings: CycleSettings) {
  let work = 0, rest = 0;
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const info = getDayInfo(new Date(year, month, d), settings);
    if (info.cyclePhase === "work") work++;
    else rest++;
  }
  return { work, rest };
}

function getUpcomingRest(settings: CycleSettings): { days: number; date: Date } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 30; i++) {
    const check = new Date(today);
    check.setDate(today.getDate() + i);
    const info = getDayInfo(check, settings);
    if (info.cyclePhase === "rest") {
      return { days: i, date: check };
    }
  }
  return null;
}

export default function Index() {
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifDismissed, setNotifDismissed] = useState<string[]>([]);

  // Events / holidays
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [newEventLabel, setNewEventLabel] = useState("");
  const [newEventEmoji, setNewEventEmoji] = useState("🎉");
  const [newEventColor, setNewEventColor] = useState("#f59e0b");

  const [settings, setSettings] = useState<CycleSettings>({
    workDays: 4,
    restDays: 2,
    startDate: "2026-01-01",
    startDayType: "work",
  });

  const [tempSettings, setTempSettings] = useState<CycleSettings>(settings);
  const [workColor, setWorkColor] = useState("#3b82f6");
  const [restColor, setRestColor] = useState("#ef4444");
  const [todayBorder, setTodayBorder] = useState("#facc15");

  const buildNotifications = useCallback(() => {
    const notifs: Notification[] = [];
    const upcoming = getUpcomingRest(settings);
    if (upcoming) {
      const id = `rest-${upcoming.date.toISOString().slice(0, 10)}`;
      if (!notifDismissed.includes(id)) {
        notifs.push({
          id,
          message:
            upcoming.days === 1
              ? "🔴 Завтра начинается выходной период!"
              : upcoming.days <= 3
              ? `🟡 Через ${upcoming.days} дня начнутся выходные`
              : `⚪ До следующих выходных ${upcoming.days} дней`,
          type: upcoming.days <= 3 ? "warning" : "info",
          date: upcoming.date.toLocaleDateString("ru-RU"),
        });
      }
    }

    const todayInfo = getDayInfo(today, settings);
    if (todayInfo.cyclePhase === "rest") {
      const id = `today-rest`;
      if (!notifDismissed.includes(id)) {
        notifs.push({
          id,
          message: "🔴 Сегодня выходной день по вашему графику",
          type: "warning",
          date: today.toLocaleDateString("ru-RU"),
        });
      }
    }

    setNotifications(notifs);
  }, [settings, notifDismissed]);

  useEffect(() => {
    buildNotifications();
  }, [buildNotifications]);

  const days = getMonthDays(currentYear, currentMonth, settings);
  const monthStats = getMonthStats(currentYear, currentMonth, settings);
  const yearStats = getYearStats(currentYear, settings);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  }

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setViewMode("month");
  }

  function saveSettings() {
    setSettings(tempSettings);
    setShowSettings(false);
  }

  function dismissNotif(id: string) {
    setNotifDismissed(prev => [...prev, id]);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  function getDayBg(type: DayType): string {
    if (type === "today-work") return workColor;
    if (type === "today-rest") return restColor;
    if (type === "work") return workColor + "22";
    if (type === "rest") return restColor + "33";
    return "transparent";
  }

  function getDayTextColor(type: DayType): string {
    if (type === "today-work" || type === "today-rest") return "#fff";
    if (type === "work") return workColor;
    if (type === "rest") return restColor;
    return "#888";
  }

  function openDayModal(dayInfo: DayInfo) {
    setSelectedDay(dayInfo);
    setNewEventLabel("");
    setNewEventEmoji("🎉");
    setNewEventColor("#f59e0b");
    setShowDayModal(true);
  }

  function addEvent() {
    if (!selectedDay || !newEventLabel.trim()) return;
    const key = toDateKey(selectedDay.date);
    const existing = events.find(e => e.dateKey === key);
    if (existing) {
      setEvents(ev => ev.map(e => e.dateKey === key ? { ...e, label: newEventLabel, emoji: newEventEmoji, color: newEventColor } : e));
    } else {
      setEvents(ev => [...ev, { dateKey: key, label: newEventLabel, emoji: newEventEmoji, color: newEventColor }]);
    }
    setShowDayModal(false);
  }

  function removeEvent(dateKey: string) {
    setEvents(ev => ev.filter(e => e.dateKey !== dateKey));
    setShowDayModal(false);
  }

  function getEventForDay(date: Date): DayEvent | undefined {
    return events.find(e => e.dateKey === toDateKey(date));
  }

  // Upcoming events (next 30 days)
  const upcomingEvents = events
    .filter(e => {
      const d = new Date(e.dateKey);
      const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const unreadCount = notifications.length + (upcomingEvents.length > 0 ? 1 : 0);

  return (
    <div className="min-h-screen font-golos" style={{ background: "var(--bg-main)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-sm" style={{ background: "rgba(10,10,20,0.7)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
            <Icon name="CalendarDays" size={18} />
          </div>
          <div>
            <h1 className="font-oswald text-xl font-bold tracking-wide text-white">РАБОЧИЙ ЦИКЛ</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {settings.workDays} рабочих · {settings.restDays} выходных
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-sm font-medium transition-all ${viewMode === "month" ? "text-white" : "text-gray-400 hover:text-white"}`}
              style={viewMode === "month" ? { background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" } : {}}
            >
              Месяц
            </button>
            <button
              onClick={() => setViewMode("year")}
              className={`px-3 py-1.5 text-sm font-medium transition-all ${viewMode === "year" ? "text-white" : "text-gray-400 hover:text-white"}`}
              style={viewMode === "year" ? { background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" } : {}}
            >
              Год
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl text-sm font-medium text-white border border-white/10 hover:border-white/30 transition-all"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            Сегодня
          </button>

          <button
            onClick={() => window.print()}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white"
            style={{ background: "rgba(255,255,255,0.05)" }}
            title="Печать / Сохранить PDF"
          >
            <Icon name="Printer" size={16} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <Icon name="Bell" size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: "#ef4444" }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in" style={{ background: "rgba(15,15,30,0.97)", backdropFilter: "blur(20px)" }}>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <span className="font-oswald text-sm font-bold text-white tracking-wide">УВЕДОМЛЕНИЯ</span>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white">
                    <Icon name="X" size={14} />
                  </button>
                </div>
                {notifications.length === 0 && upcomingEvents.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">Нет новых уведомлений</div>
                ) : (
                  <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl ${n.type === "warning" ? "bg-red-500/10 border border-red-500/20" : "bg-blue-500/10 border border-blue-500/20"}`}>
                        <div className="flex-1">
                          <p className="text-sm text-white leading-relaxed">{n.message}</p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{n.date}</p>
                        </div>
                        <button onClick={() => dismissNotif(n.id)} className="text-gray-500 hover:text-gray-300 mt-0.5">
                          <Icon name="X" size={12} />
                        </button>
                      </div>
                    ))}
                    {upcomingEvents.map(ev => {
                      const d = new Date(ev.dateKey);
                      const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
                      return (
                        <div key={ev.dateKey} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: ev.color + "40", background: ev.color + "12" }}>
                          <span className="text-lg">{ev.emoji}</span>
                          <div className="flex-1">
                            <p className="text-sm text-white">{ev.label}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {diff === 0 ? "Сегодня" : diff === 1 ? "Завтра" : `Через ${diff} дн.`} · {d.getDate()} {MONTHS_RU_GEN[d.getMonth()]}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => { setTempSettings(settings); setShowSettings(true); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white"
            style={{ background: "rgba(255,255,255,0.05)" }}
            title="Настройки"
          >
            <Icon name="Settings" size={16} />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Рабочих в месяце", value: monthStats.work, icon: "Briefcase", color: workColor },
            { label: "Выходных в месяце", value: monthStats.rest, icon: "Coffee", color: restColor },
            { label: "Рабочих в году", value: yearStats.work, icon: "TrendingUp", color: "#3b82f6" },
            { label: "Выходных в году", value: yearStats.rest, icon: "Palmtree", color: "#ef4444" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border border-white/10 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: s.color + "22" }}>
                  <Icon name={s.icon} fallback="Star" size={14} style={{ color: s.color }} />
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</span>
              </div>
              <p className="font-oswald text-3xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {viewMode === "month" ? (
          <MonthView
            year={currentYear}
            month={currentMonth}
            days={days}
            onPrev={prevMonth}
            onNext={nextMonth}
            todayBorder={todayBorder}
            getDayBg={getDayBg}
            getDayTextColor={getDayTextColor}
            getEventForDay={getEventForDay}
            onDayClick={openDayModal}
          />
        ) : (
          <YearView
            year={currentYear}
            settings={settings}
            onPrevYear={() => setCurrentYear(y => y - 1)}
            onNextYear={() => setCurrentYear(y => y + 1)}
            onSelectMonth={(m) => { setCurrentMonth(m); setViewMode("month"); }}
            todayBorder={todayBorder}
            getDayBg={getDayBg}
            getDayTextColor={getDayTextColor}
            getEventForDay={getEventForDay}
            onDayClick={openDayModal}
          />
        )}

        {/* Legend + upcoming events */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 border border-white/10 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
            <span className="font-oswald text-sm font-bold text-white tracking-wide block mb-3">ЛЕГЕНДА</span>
            <div className="flex flex-wrap gap-3">
              {[
                { color: workColor + "22", border: workColor, text: workColor, label: "Рабочий день" },
                { color: restColor + "33", border: restColor, text: restColor, label: "Выходной день" },
                { color: workColor, border: todayBorder, text: "#fff", label: "Сегодня (рабочий)" },
                { color: restColor, border: todayBorder, text: "#fff", label: "Сегодня (выходной)" },
                { color: "#f59e0b22", border: "#f59e0b", text: "#f59e0b", label: "День с событием" },
              ].map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2" style={{ background: l.color, borderColor: l.border, color: l.text }}>
                    {i === 4 ? "⭐" : i < 2 ? "15" : today.getDate()}
                  </div>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <Icon name="RefreshCw" size={12} />
              <span>Цикл: {settings.workDays} раб. + {settings.restDays} вых. · Нажмите на день чтобы добавить событие</span>
            </div>
          </div>

          <div className="rounded-2xl p-4 border border-white/10 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.04)" }}>
            <span className="font-oswald text-sm font-bold text-white tracking-wide block mb-3">
              СОБЫТИЯ {events.length > 0 && <span className="text-xs font-normal ml-2 text-gray-400">({events.length})</span>}
            </span>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">Нажмите на любой день в календаре, чтобы отметить праздник или событие</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {events
                  .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
                  .map(ev => {
                    const d = new Date(ev.dateKey);
                    return (
                      <div key={ev.dateKey} className="flex items-center gap-2 group">
                        <span className="text-base">{ev.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{ev.label}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{d.getDate()} {MONTHS_RU_GEN[d.getMonth()]} {d.getFullYear()}</p>
                        </div>
                        <button
                          onClick={() => removeEvent(ev.dateKey)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"
                        >
                          <Icon name="Trash2" size={12} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Day event modal */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setShowDayModal(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-scale-in" style={{ background: "rgba(12,12,24,0.98)" }} onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-oswald text-lg font-bold text-white tracking-wide">
                  {selectedDay.date.getDate()} {MONTHS_RU_GEN[selectedDay.date.getMonth()]} {selectedDay.date.getFullYear()}
                </h2>
                <button onClick={() => setShowDayModal(false)} className="text-gray-400 hover:text-white">
                  <Icon name="X" size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                  background: selectedDay.cyclePhase === "work" ? "#3b82f622" : "#ef444422",
                  color: selectedDay.cyclePhase === "work" ? "#3b82f6" : "#ef4444"
                }}>
                  {selectedDay.cyclePhase === "work" ? "Рабочий день" : "Выходной день"}
                </span>
                {getEventForDay(selectedDay.date) && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f59e0b22", color: "#f59e0b" }}>
                    Есть событие
                  </span>
                )}
              </div>
            </div>

            {getEventForDay(selectedDay.date) ? (
              <div className="p-5">
                <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: getEventForDay(selectedDay.date)!.color + "15", border: `1px solid ${getEventForDay(selectedDay.date)!.color}30` }}>
                  <span className="text-2xl">{getEventForDay(selectedDay.date)!.emoji}</span>
                  <p className="text-white font-medium">{getEventForDay(selectedDay.date)!.label}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { removeEvent(toDateKey(selectedDay.date)); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Удалить
                  </button>
                  <button
                    onClick={() => {
                      const ev = getEventForDay(selectedDay.date)!;
                      setNewEventLabel(ev.label);
                      setNewEventEmoji(ev.emoji);
                      setNewEventColor(ev.color);
                      removeEvent(toDateKey(selectedDay.date));
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-gray-300 hover:text-white transition-all"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    Изменить
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Название события</label>
                  <input
                    type="text"
                    value={newEventLabel}
                    onChange={e => setNewEventLabel(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addEvent()}
                    placeholder="Например: День рождения"
                    className="w-full px-4 py-2.5 rounded-xl text-white border border-white/15 outline-none focus:border-yellow-400/50 transition-colors text-sm"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Иконка</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map(em => (
                      <button
                        key={em}
                        onClick={() => setNewEventEmoji(em)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all border"
                        style={newEventEmoji === em
                          ? { background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)" }
                          : { background: "rgba(255,255,255,0.05)", borderColor: "transparent" }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Цвет</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewEventColor(c)}
                        className="w-7 h-7 rounded-lg transition-all border-2"
                        style={{ background: c, borderColor: newEventColor === c ? "#fff" : "transparent" }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={addEvent}
                  disabled={!newEventLabel.trim()}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ background: newEventLabel.trim() ? `linear-gradient(135deg, ${newEventColor}, ${newEventColor}aa)` : "rgba(255,255,255,0.1)" }}
                >
                  {newEventEmoji} Добавить событие
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-scale-in" style={{ background: "rgba(12,12,24,0.97)" }}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-oswald text-xl font-bold text-white tracking-wide">НАСТРОЙКИ ЦИКЛА</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>Рабочих дней подряд</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => setTempSettings(s => ({ ...s, workDays: n }))}
                      className="flex-1 py-2 rounded-xl font-bold text-sm transition-all border"
                      style={tempSettings.workDays === n
                        ? { background: workColor, color: "#fff", borderColor: workColor }
                        : { background: "rgba(255,255,255,0.05)", color: "#888", borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>Выходных дней подряд</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setTempSettings(s => ({ ...s, restDays: n }))}
                      className="flex-1 py-2 rounded-xl font-bold text-sm transition-all border"
                      style={tempSettings.restDays === n
                        ? { background: restColor, color: "#fff", borderColor: restColor }
                        : { background: "rgba(255,255,255,0.05)", color: "#888", borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>Начальная дата отсчёта</label>
                <input
                  type="date"
                  value={tempSettings.startDate}
                  onChange={e => setTempSettings(s => ({ ...s, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-white border border-white/15 outline-none focus:border-blue-500 transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>Начать цикл с</label>
                <div className="flex gap-2">
                  {[{ val: "work", label: "Рабочего дня" }, { val: "rest", label: "Выходного дня" }].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setTempSettings(s => ({ ...s, startDayType: opt.val as "work" | "rest" }))}
                      className="flex-1 py-2 rounded-xl font-medium text-sm transition-all border"
                      style={tempSettings.startDayType === opt.val
                        ? { background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", borderColor: "#3b82f6" }
                        : { background: "rgba(255,255,255,0.05)", color: "#888", borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Цвет рабочих</label>
                  <input type="color" value={workColor} onChange={e => setWorkColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer border border-white/15" style={{ background: "transparent" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Цвет выходных</label>
                  <input type="color" value={restColor} onChange={e => setRestColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer border border-white/15" style={{ background: "transparent" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Рамка «сегодня»</label>
                  <input type="color" value={todayBorder} onChange={e => setTodayBorder(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer border border-white/15" style={{ background: "transparent" }} />
                </div>
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 rounded-xl font-medium text-sm border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-all"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                Отмена
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthView({
  year, month, days, onPrev, onNext,
  todayBorder, getDayBg, getDayTextColor, getEventForDay, onDayClick
}: {
  year: number;
  month: number;
  days: (DayInfo | null)[];
  onPrev: () => void;
  onNext: () => void;
  todayBorder: string;
  getDayBg: (t: DayType) => string;
  getDayTextColor: (t: DayType) => string;
  getEventForDay: (d: Date) => DayEvent | undefined;
  onDayClick: (d: DayInfo) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 overflow-hidden backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button onClick={onPrev} className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>
          <Icon name="ChevronLeft" size={16} />
        </button>
        <h2 className="font-oswald text-2xl font-bold text-white tracking-wide">
          {MONTHS_RU[month].toUpperCase()} {year}
        </h2>
        <button onClick={onNext} className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-xs font-bold py-2 tracking-widest" style={{ color: "var(--text-muted)" }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (!day) return <div key={i} />;
            const ev = getEventForDay(day.date);
            const isToday = day.type === "today-work" || day.type === "today-rest";
            return (
              <button
                key={i}
                onClick={() => onDayClick(day)}
                className="relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all hover:scale-105 hover:z-10 cursor-pointer group"
                style={{
                  background: getDayBg(day.type),
                  color: getDayTextColor(day.type),
                  border: isToday ? `2px solid ${todayBorder}` : ev ? `2px solid ${ev.color}80` : "2px solid transparent",
                  boxShadow: isToday ? `0 0 12px ${todayBorder}40` : "none",
                }}
                title={ev ? ev.emoji + " " + ev.label : undefined}
              >
                <span className="text-sm font-bold leading-none">{day.date.getDate()}</span>
                {ev && (
                  <span className="text-[10px] leading-none mt-0.5">{ev.emoji}</span>
                )}
                {!ev && (
                  <span className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]" style={{ color: "var(--text-muted)" }}>
                    +
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function YearView({
  year, settings, onPrevYear, onNextYear, onSelectMonth,
  todayBorder, getDayBg, getDayTextColor, getEventForDay, onDayClick
}: {
  year: number;
  settings: CycleSettings;
  onPrevYear: () => void;
  onNextYear: () => void;
  onSelectMonth: (m: number) => void;
  todayBorder: string;
  getDayBg: (t: DayType) => string;
  getDayTextColor: (t: DayType) => string;
  getEventForDay: (d: Date) => DayEvent | undefined;
  onDayClick: (d: DayInfo) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 overflow-hidden backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button onClick={onPrevYear} className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>
          <Icon name="ChevronLeft" size={16} />
        </button>
        <h2 className="font-oswald text-2xl font-bold text-white tracking-wide">{year}</h2>
        <button onClick={onNextYear} className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {MONTHS_RU.map((mName, m) => {
          const mDays = getMonthDays(year, m, settings);
          return (
            <div key={m} className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
              <button
                onClick={() => onSelectMonth(m)}
                className="w-full px-3 py-2 font-oswald text-sm font-bold tracking-wide text-white hover:text-blue-300 transition-colors text-center border-b border-white/10"
              >
                {mName.toUpperCase()}
              </button>
              <div className="p-2">
                <div className="grid grid-cols-7 mb-1">
                  {DAYS_SHORT.map(d => (
                    <div key={d} className="text-center text-[8px]" style={{ color: "var(--text-muted)" }}>{d[0]}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {mDays.map((day, i) => {
                    if (!day) return <div key={i} className="aspect-square" />;
                    const ev = getEventForDay(day.date);
                    const isToday = day.type === "today-work" || day.type === "today-rest";
                    return (
                      <button
                        key={i}
                        onClick={() => onDayClick(day)}
                        className="aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium transition-all hover:opacity-80 cursor-pointer relative"
                        style={{
                          background: getDayBg(day.type),
                          color: getDayTextColor(day.type),
                          outline: isToday ? `1.5px solid ${todayBorder}` : ev ? `1.5px solid ${ev.color}` : "none",
                          outlineOffset: "1px",
                        }}
                        title={ev ? ev.label : undefined}
                      >
                        {ev ? ev.emoji.slice(0, 1) : day.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
