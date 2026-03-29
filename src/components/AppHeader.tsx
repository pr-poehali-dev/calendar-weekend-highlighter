import Icon from "@/components/ui/icon";
import { CycleSettings, DayEvent, Notification, MONTHS_RU_GEN } from "@/lib/calendar";

interface AppHeaderProps {
  settings: CycleSettings;
  viewMode: "month" | "year";
  onViewModeChange: (mode: "month" | "year") => void;
  onGoToToday: () => void;
  onOpenSettings: () => void;
  notifications: Notification[];
  upcomingEvents: DayEvent[];
  showNotifications: boolean;
  onToggleNotifications: () => void;
  onDismissNotif: (id: string) => void;
  unreadCount: number;
}

export default function AppHeader({
  settings,
  viewMode,
  onViewModeChange,
  onGoToToday,
  onOpenSettings,
  notifications,
  upcomingEvents,
  showNotifications,
  onToggleNotifications,
  onDismissNotif,
  unreadCount,
}: AppHeaderProps) {
  const today = new Date();

  return (
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
            onClick={() => onViewModeChange("month")}
            className={`px-3 py-1.5 text-sm font-medium transition-all ${viewMode === "month" ? "text-white" : "text-gray-400 hover:text-white"}`}
            style={viewMode === "month" ? { background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" } : {}}
          >
            Месяц
          </button>
          <button
            onClick={() => onViewModeChange("year")}
            className={`px-3 py-1.5 text-sm font-medium transition-all ${viewMode === "year" ? "text-white" : "text-gray-400 hover:text-white"}`}
            style={viewMode === "year" ? { background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" } : {}}
          >
            Год
          </button>
        </div>

        <button
          onClick={onGoToToday}
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
            onClick={onToggleNotifications}
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
                <button onClick={onToggleNotifications} className="text-gray-400 hover:text-white">
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
                      <button onClick={() => onDismissNotif(n.id)} className="text-gray-500 hover:text-gray-300 mt-0.5">
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
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all text-gray-300 hover:text-white"
          style={{ background: "rgba(255,255,255,0.05)" }}
          title="Настройки"
        >
          <Icon name="Settings" size={16} />
        </button>
      </div>
    </header>
  );
}
