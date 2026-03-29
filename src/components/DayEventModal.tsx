import Icon from "@/components/ui/icon";
import { DayEvent, DayInfo, MONTHS_RU_GEN, EMOJI_OPTIONS, COLOR_OPTIONS, toDateKey } from "@/lib/calendar";

interface DayEventModalProps {
  selectedDay: DayInfo;
  existingEvent: DayEvent | undefined;
  newEventLabel: string;
  newEventEmoji: string;
  newEventColor: string;
  onLabelChange: (v: string) => void;
  onEmojiChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (dateKey: string) => void;
  onEdit: (ev: DayEvent) => void;
  onClose: () => void;
}

export default function DayEventModal({
  selectedDay,
  existingEvent,
  newEventLabel,
  newEventEmoji,
  newEventColor,
  onLabelChange,
  onEmojiChange,
  onColorChange,
  onAdd,
  onRemove,
  onEdit,
  onClose,
}: DayEventModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-scale-in"
        style={{ background: "rgba(12,12,24,0.98)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-oswald text-lg font-bold text-white tracking-wide">
              {selectedDay.date.getDate()} {MONTHS_RU_GEN[selectedDay.date.getMonth()]} {selectedDay.date.getFullYear()}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: selectedDay.cyclePhase === "work" ? "#3b82f622" : "#ef444422",
                color: selectedDay.cyclePhase === "work" ? "#3b82f6" : "#ef4444",
              }}
            >
              {selectedDay.cyclePhase === "work" ? "Рабочий день" : "Выходной день"}
            </span>
            {existingEvent && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f59e0b22", color: "#f59e0b" }}>
                Есть событие
              </span>
            )}
          </div>
        </div>

        {existingEvent ? (
          <div className="p-5">
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-4"
              style={{ background: existingEvent.color + "15", border: `1px solid ${existingEvent.color}30` }}
            >
              <span className="text-2xl">{existingEvent.emoji}</span>
              <p className="text-white font-medium">{existingEvent.label}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRemove(toDateKey(selectedDay.date))}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
              >
                Удалить
              </button>
              <button
                onClick={() => onEdit(existingEvent)}
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
                onChange={e => onLabelChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onAdd()}
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
                    onClick={() => onEmojiChange(em)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all border"
                    style={
                      newEventEmoji === em
                        ? { background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)" }
                        : { background: "rgba(255,255,255,0.05)", borderColor: "transparent" }
                    }
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
                    onClick={() => onColorChange(c)}
                    className="w-7 h-7 rounded-lg transition-all border-2"
                    style={{ background: c, borderColor: newEventColor === c ? "#fff" : "transparent" }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={onAdd}
              disabled={!newEventLabel.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{
                background: newEventLabel.trim()
                  ? `linear-gradient(135deg, ${newEventColor}, ${newEventColor}aa)`
                  : "rgba(255,255,255,0.1)",
              }}
            >
              {newEventEmoji} Добавить событие
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
