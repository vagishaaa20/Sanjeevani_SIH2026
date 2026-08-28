export default function Button({ children, onClick, style, type, disabled }) {
  return (
    <button 
      disabled={disabled}
      type={type || "button"}
      onClick={onClick} 
      style={{
        padding: "10px 20px", background: "#2563eb", color: "#fff", 
        border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)", transition: "all 0.2s ease-in-out",
        ...style
      }}
    >
      {children}
    </button>
  );
}