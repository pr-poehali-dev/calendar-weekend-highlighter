import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import AppHeader from "@/components/AppHeader";
import DayEventModal from "@/components/DayEventModal";
import SettingsModal from "@/components/SettingsModal";
import LockScreen from "@/components/LockScreen";
import { MonthView, YearView, LegendPanel } from "@/components/CalendarGrid";
import {
  CycleSettings, DayEvent, DayInfo, DayType, Notification,
  DEFAULT_SETTINGS, toDateKey, getDayInfo, getMonthDays,
  getMonthStats, getYearStats, getUpcomingRest,
} from "@/lib/calendar";

// ── Auth wrapper ─────────────────────────────────────────────────────────────

export default function Index() {
  const [storedPassword, setStoredPassword] = useState<string | null>(
    () => localStorage.getItem("rc_password")
  );
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem("rc_unlocked") === "1"
  );

  function handleUnlock(input: string): boolean {
    if (input === storedPassword) {
      sessionStorage.setItem("rc_unlocked", "1");
      setIsUnlocked(true);
      return true;
    }
    return false;
  }

  function handleSetPassword(password: string) {
    localStorage.setItem("rc_password", password);
    sessionStorage.setItem("rc_unlocked", "1");
    setStoredPassword(password);
    setIsUnlocked(true);
  }

  function handleChangePassword(newPassword: string) {
    localStorage.setItem("rc_password", newPassword);
    setStoredPassword(newPassword);
  }

  if (!isUnlocked) {
    return (
      <LockScreen
        isFirstTime={!storedPassword}
        onUnlock={handleUnlock}
        onSetPassword={handleSetPassword}
      />
    );
  }

  return <CalendarApp onChangePassword={handleChangePassword} />;
}

// ── Calendar app ─────────────────────────────────────────────────────────────

function CalendarApp({ onChangePassword }: { onChangePassword: (p: string) => void }) {
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifDismissed, setNotifDismissed] = useState<string[]>([]);

  const [events, setEvents] = useState<DayEvent[]>(() => {
    try { return JSON.parse(localStorage.getItem("rc_events") || "[]"); } catch { return []; }
  });
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [newEventLabel, setNewEventLabel] = useState("");
  const [newEventEmoji, setNewEventEmoji] = useState("🎉");
  const [newEventColor, setNewEventColor] = useState("#f59e0b");

  const [settings, setSettings] = useState<CycleSettings>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rc_settings") || "null");
      if (saved && saved.startDate !== "2026-03-31") return DEFAULT_SETTINGS;
      return saved || DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [tempSettings, setTempSettings] = useState<CycleSettings>(settings);
  const [workColor, setWorkColor] = useState("#3b82f6");
  const [restColor, setRestColor] = useState("#ef4444");
  const [todayBorder, setTodayBorder] = useState("#facc15");

  useEffect(() => { localStorage.setItem("rc_events", JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem("rc_settings", JSON.stringify(settings)); }, [settings]);

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

  useEffect(() => { buildNotifications(); }, [buildNotifications]);

  const days = getMonthDays(currentYear, currentMonth, settings);
  const monthStats = getMonthStats(currentYear, currentMonth, settings);
  const yearStats = getYearStats(currentYear, settings);

  const upcomingEvents = events
    .filter(e => {
      const d = new Date(e.dateKey);
      const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const unreadCount = notifications.length + (upcomingEvents.length > 0 ? 1 : 0);

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

  return (
    <div className="min-h-screen font-golos" style={{ background: "var(--bg-main)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <AppHeader
        settings={settings}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onGoToToday={goToToday}
        onOpenSettings={() => { setTempSettings(settings); setShowSettings(true); }}
        notifications={notifications}
        upcomingEvents={upcomingEvents}
        showNotifications={showNotifications}
        onToggleNotifications={() => setShowNotifications(v => !v)}
        onDismissNotif={dismissNotif}
        unreadCount={unreadCount}
      />

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

        <LegendPanel
          settings={settings}
          workColor={workColor}
          restColor={restColor}
          todayBorder={todayBorder}
          events={events}
          onRemoveEvent={removeEvent}
        />
      </main>

      {showDayModal && selectedDay && (
        <DayEventModal
          selectedDay={selectedDay}
          existingEvent={getEventForDay(selectedDay.date)}
          newEventLabel={newEventLabel}
          newEventEmoji={newEventEmoji}
          newEventColor={newEventColor}
          onLabelChange={setNewEventLabel}
          onEmojiChange={setNewEventEmoji}
          onColorChange={setNewEventColor}
          onAdd={addEvent}
          onRemove={removeEvent}
          onEdit={(ev) => {
            setNewEventLabel(ev.label);
            setNewEventEmoji(ev.emoji);
            setNewEventColor(ev.color);
            removeEvent(toDateKey(selectedDay.date));
          }}
          onClose={() => setShowDayModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          tempSettings={tempSettings}
          workColor={workColor}
          restColor={restColor}
          todayBorder={todayBorder}
          onTempSettingsChange={setTempSettings}
          onWorkColorChange={setWorkColor}
          onRestColorChange={setRestColor}
          onTodayBorderChange={setTodayBorder}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
          onChangePassword={onChangePassword}
        />
      )}
    </div>
  );
}
