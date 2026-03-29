import Icon from "@/components/ui/icon";
import { CycleSettings } from "@/lib/calendar";

interface SettingsModalProps {
  tempSettings: CycleSettings;
  workColor: string;
  restColor: string;
  todayBorder: string;
  onTempSettingsChange: (s: CycleSettings) => void;
  onWorkColorChange: (c: string) => void;
  onRestColorChange: (c: string) => void;
  onTodayBorderChange: (c: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function SettingsModal({
  tempSettings,
  workColor,
  restColor,
  todayBorder,
  onTempSettingsChange,
  onWorkColorChange,
  onRestColorChange,
  onTodayBorderChange,
  onSave,
  onClose,
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-scale-in" style={{ background: "rgba(12,12,24,0.97)" }}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-oswald text-xl font-bold text-white tracking-wide">НАСТРОЙКИ ЦИКЛА</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
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
                  onClick={() => onTempSettingsChange({ ...tempSettings, workDays: n })}
                  className="flex-1 py-2 rounded-xl font-bold text-sm transition-all border"
                  style={
                    tempSettings.workDays === n
                      ? { background: workColor, color: "#fff", borderColor: workColor }
                      : { background: "rgba(255,255,255,0.05)", color: "#888", borderColor: "rgba(255,255,255,0.1)" }
                  }
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
                  onClick={() => onTempSettingsChange({ ...tempSettings, restDays: n })}
                  className="flex-1 py-2 rounded-xl font-bold text-sm transition-all border"
                  style={
                    tempSettings.restDays === n
                      ? { background: restColor, color: "#fff", borderColor: restColor }
                      : { background: "rgba(255,255,255,0.05)", color: "#888", borderColor: "rgba(255,255,255,0.1)" }
                  }
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
              onChange={e => onTempSettingsChange({ ...tempSettings, startDate: e.target.value })}
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
                  onClick={() => onTempSettingsChange({ ...tempSettings, startDayType: opt.val as "work" | "rest" })}
                  className="flex-1 py-2 rounded-xl font-medium text-sm transition-all border"
                  style={
                    tempSettings.startDayType === opt.val
                      ? { background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", borderColor: "#3b82f6" }
                      : { background: "rgba(255,255,255,0.05)", color: "#888", borderColor: "rgba(255,255,255,0.1)" }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Цвет рабочих</label>
              <input
                type="color"
                value={workColor}
                onChange={e => onWorkColorChange(e.target.value)}
                className="w-full h-10 rounded-xl cursor-pointer border border-white/15"
                style={{ background: "transparent" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Цвет выходных</label>
              <input
                type="color"
                value={restColor}
                onChange={e => onRestColorChange(e.target.value)}
                className="w-full h-10 rounded-xl cursor-pointer border border-white/15"
                style={{ background: "transparent" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Рамка «сегодня»</label>
              <input
                type="color"
                value={todayBorder}
                onChange={e => onTodayBorderChange(e.target.value)}
                className="w-full h-10 rounded-xl cursor-pointer border border-white/15"
                style={{ background: "transparent" }}
              />
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-sm border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-all"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            Отмена
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
