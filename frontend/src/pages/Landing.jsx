import { Link } from "react-router-dom";

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
  },
  logo: {
    margin: 0,
  },
  navLinks: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  link: {
    textDecoration: "none",
    color: "#333",
  },
  hero: {
    textAlign: "center",
    padding: "100px 20px",
  },
  heroTitle: {
    fontSize: "2.5rem",
    marginBottom: "12px",
  },
  heroText: {
    fontSize: "1.1rem",
    color: "#666",
    marginBottom: "24px",
  },
  btnPrimary: {
    background: "#2563eb",
    color: "white",
    padding: "10px 20px",
    borderRadius: "6px",
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    display: "inline-block",
  },
  btnLarge: {
    padding: "14px 28px",
    fontSize: "1.1rem",
  },
};

export default function Landing() {
  return (
    <div>
      <nav style={styles.nav}>
        <h2 style={styles.logo}>Sanjeevani</h2>
        <div style={styles.navLinks}>
          <Link to="/login" style={styles.link}>Login</Link>
          <Link to="/register" style={styles.btnPrimary}>Register</Link>
        </div>
      </nav>

      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Welcome to Sanjeevani</h1>
        <p style={styles.heroText}>Your platform for [describe what it does here].</p>
        <Link to="/register" style={{ ...styles.btnPrimary, ...styles.btnLarge }}>
          Get Started
        </Link>
      </section>
    </div>
  );
}