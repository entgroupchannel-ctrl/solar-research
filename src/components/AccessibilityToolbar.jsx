import { useState, useEffect } from "react";
import { Sun, Moon, AArrowUp, AArrowDown, RotateCcw } from "lucide-react";

const FONT_SIZES = [14, 15, 16, 18, 20];
const DEFAULT_FONT_SIZE = 16;

const AccessibilityToolbar = () => {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });
  const [fontIdx, setFontIdx] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem("fontSizeIdx"));
      return !isNaN(saved) && saved >= 0 && saved < FONT_SIZES.length ? saved : 2;
    } catch { return 2; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontIdx] + "px";
    localStorage.setItem("fontSizeIdx", String(fontIdx));
  }, [fontIdx]);

  const increase = () => setFontIdx(i => Math.min(i + 1, FONT_SIZES.length - 1));
  const decrease = () => setFontIdx(i => Math.max(i - 1, 0));
  const reset = () => { setFontIdx(2); setIsDark(false); };

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 99999,
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8,
    }}>
      {open && (
        <div style={{
          background: isDark ? "#1e293b" : "#fff",
          border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
          borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", gap: 8,
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 180,
        }}>
          {/* Dark/Light toggle */}
          <button onClick={() => setIsDark(!isDark)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: isDark ? "rgba(250,204,21,0.15)" : "rgba(30,41,59,0.08)",
            color: isDark ? "#facc15" : "#1e293b", width: "100%",
          }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

          {/* Font size controls */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 8px",
            background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
            borderRadius: 10,
          }}>
            <button onClick={decrease} disabled={fontIdx === 0} style={{
              width: 34, height: 34, borderRadius: 8, border: "none", cursor: fontIdx === 0 ? "default" : "pointer",
              background: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#94a3b8" : "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: fontIdx === 0 ? 0.4 : 1,
            }}><AArrowDown size={16} /></button>

            <span style={{ flex: 1, textAlign: "center", fontSize: 12, fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b" }}>
              {FONT_SIZES[fontIdx]}px
            </span>

            <button onClick={increase} disabled={fontIdx === FONT_SIZES.length - 1} style={{
              width: 34, height: 34, borderRadius: 8, border: "none", cursor: fontIdx === FONT_SIZES.length - 1 ? "default" : "pointer",
              background: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#94a3b8" : "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: fontIdx === FONT_SIZES.length - 1 ? 0.4 : 1,
            }}><AArrowUp size={16} /></button>
          </div>

          {/* Reset */}
          <button onClick={reset} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
            borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12,
            background: "transparent", color: isDark ? "#94a3b8" : "#64748b",
          }}>
            <RotateCcw size={14} /> รีเซ็ต
          </button>
        </div>
      )}

      {/* FAB toggle */}
      <button onClick={() => setOpen(!open)} style={{
        width: 48, height: 48, borderRadius: 14, border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #059669, #10b981)",
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(5,150,105,0.4)",
        transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0deg)",
        fontSize: 20, fontWeight: 700,
      }}>
        {open ? "✕" : "Aa"}
      </button>
    </div>
  );
};

export default AccessibilityToolbar;
