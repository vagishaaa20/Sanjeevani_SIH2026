export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "500px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)", position: "relative"
      }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "1.25rem", fontWeight: "700" }}>{title}</h3>
        <button 
          onClick={onClose}
          style={{ position: "absolute", top: "16px", right: "16px", border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer" }}
        >
          ×
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
}