import Icon from "@/components/ui/icon";
import {
  CycleSettings, DayEvent, DayInfo, DayType,
  MONTHS_RU, MONTHS_RU_GEN, DAYS_SHORT,
  getMonthDays,
} from "@/lib/calendar";

interface CalendarSharedProps {
  todayBorder: string;
  getDayBg: (t: DayType) => string;
  getDayTextColor: (t: DayType) => string;
  getEventForDay: (d: Date) => DayEvent | undefined;
  onDayClick: (d: DayInfo) => void;
}

// ─── Month View ──────────────────────────────────────────────────────────────

interface MonthViewProps extends CalendarSharedProps {
  year: number;
  month: number;
  days: (DayInfo | null)[];
  onPrev: () => void;
  onNext: () => void;
}

export function MonthView({
  year, month, days, onPrev, onNext,
  todayBorder, getDayBg, getDayTextColor, getEventForDay, onDayClick,
}: MonthViewProps) {
  return (
    <div className="rounded-3xl border border-white/10 overflow-hidden backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button
          onClick={onPrev}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <Icon name="ChevronLeft" size={16} />
        </button>
        <h2 className="font-oswald text-2xl font-bold text-white tracking-wide">
          {MONTHS_RU[month].toUpperCase()} {year}
        </h2>
        <button
          onClick={onNext}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
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
                  border: isToday
                    ? `2px solid ${todayBorder}`
                    : ev
                    ? `2px solid ${ev.color}80`
                    : "2px solid transparent",
                  boxShadow: isToday ? `0 0 12px ${todayBorder}40` : "none",
                }}
                title={ev ? ev.emoji + " " + ev.label : undefined}
              >
                <span className="text-sm font-bold leading-none">{day.date.getDate()}</span>
                {ev && <span className="text-[10px] leading-none mt-0.5">{ev.emoji}</span>}
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

// ─── Year View ───────────────────────────────────────────────────────────────

interface YearViewProps extends CalendarSharedProps {
  year: number;
  settings: CycleSettings;
  onPrevYear: () => void;
  onNextYear: () => void;
  onSelectMonth: (m: number) => void;
}

export function YearView({
  year, settings, onPrevYear, onNextYear, onSelectMonth,
  todayBorder, getDayBg, getDayTextColor, getEventForDay, onDayClick,
}: YearViewProps) {
  return (
    <div className="rounded-3xl border border-white/10 overflow-hidden backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button
          onClick={onPrevYear}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <Icon name="ChevronLeft" size={16} />
        </button>
        <h2 className="font-oswald text-2xl font-bold text-white tracking-wide">{year}</h2>
        <button
          onClick={onNextYear}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
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
                          outline: isToday
                            ? `1.5px solid ${todayBorder}`
                            : ev
                            ? `1.5px solid ${ev.color}`
                            : "none",
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

// ─── Legend + Events Panel ───────────────────────────────────────────────────

interface LegendPanelProps {
  settings: CycleSettings;
  workColor: string;
  restColor: string;
  todayBorder: string;
  events: DayEvent[];
  onRemoveEvent: (dateKey: string) => void;
}

export function LegendPanel({
  settings, workColor, restColor, todayBorder, events, onRemoveEvent,
}: LegendPanelProps) {
  const today = new Date();

  return (
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
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2"
                style={{ background: l.color, borderColor: l.border, color: l.text }}
              >
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
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {d.getDate()} {MONTHS_RU_GEN[d.getMonth()]} {d.getFullYear()}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveEvent(ev.dateKey)}
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
  );
}
