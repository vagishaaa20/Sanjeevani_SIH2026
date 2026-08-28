export default function Loader({ message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px" }}>
      <div style={{
        border: "4px solid #f3f4f6", borderTop: "4px solid #2563eb", 
        borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite"
      }} />
      <p style={{ marginTop: "12px", color: "#6b7280", fontSize: "0.875rem" }}>{message || "Loading..."}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}