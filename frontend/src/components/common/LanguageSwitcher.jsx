import { useState } from "react";
export default function LanguageSwitcher() {
  const [lang, setLang] = useState("en");
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button 
        onClick={() => setLang(lang === "en" ? "hi" : "en")}
        style={{
          background: "#1e293b", border: "1px solid #475569", color: "#f1f5f9",
          padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem"
        }}
      >
        🌐 {lang === "en" ? "Hindi (हिन्दी)" : "English (EN)"}
      </button>
    </div>
  );
}