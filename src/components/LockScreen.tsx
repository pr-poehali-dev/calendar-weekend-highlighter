import { useState } from "react";
import Icon from "@/components/ui/icon";

interface LockScreenProps {
  onUnlock: (password: string) => boolean;
  isFirstTime: boolean;
  onSetPassword: (password: string) => void;
}

export default function LockScreen({ onUnlock, isFirstTime, onSetPassword }: LockScreenProps) {
  const [input, setInput] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  function handleUnlock() {
    if (!input.trim()) return;
    const ok = onUnlock(input);
    if (!ok) {
      setError("Неверный пароль");
      setInput("");
    }
  }

  function handleSetPassword() {
    if (input.length < 4) { setError("Минимум 4 символа"); return; }
    if (input !== confirm) { setError("Пароли не совпадают"); return; }
    onSetPassword(input);
  }

  return (
    <div className="min-h-screen font-golos flex items-center justify-center p-4" style={{ background: "var(--bg-main)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
            <Icon name={isFirstTime ? "KeyRound" : "Lock"} size={28} />
          </div>
          <h1 className="font-oswald text-3xl font-bold tracking-wide text-white mb-1">РАБОЧИЙ ЦИКЛ</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {isFirstTime ? "Установите пароль для защиты календаря" : "Введите пароль для входа"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 p-6 backdrop-blur-sm space-y-4" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="relative">
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              {isFirstTime ? "Новый пароль" : "Пароль"}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={input}
                onChange={e => { setInput(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && (isFirstTime ? undefined : handleUnlock())}
                placeholder={isFirstTime ? "Придумайте пароль" : "Введите пароль"}
                className="w-full px-4 py-3 rounded-xl text-white border border-white/15 outline-none focus:border-blue-500/60 transition-colors pr-11"
                style={{ background: "rgba(255,255,255,0.05)" }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </div>

          {isFirstTime && (
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Повторите пароль</label>
              <input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSetPassword()}
                placeholder="Повторите пароль"
                className="w-full px-4 py-3 rounded-xl text-white border border-white/15 outline-none focus:border-blue-500/60 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <button
            onClick={isFirstTime ? handleSetPassword : handleUnlock}
            disabled={!input.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
          >
            {isFirstTime ? "Установить пароль" : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}
