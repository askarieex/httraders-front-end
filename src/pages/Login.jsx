// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Alert states
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    // Basic validation
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      setMessageType("warning");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send email and password in the request body
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        // If successful (2xx), store token and navigate
        setMessage(data.message || "Login successful!");
        setMessageType("success");
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        setTimeout(() => {
          setIsLoading(false);
          navigate("/home");
        }, 1500);
      } else {
        // Error from server
        setIsLoading(false);
        setMessage(data.error || data.message || "Login failed.");
        setMessageType("danger");
      }
    } catch (error) {
      // Network or unexpected error
      console.error(error);
      setIsLoading(false);
      setMessage("An error occurred while logging in.");
      setMessageType("danger");
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* LEFT SECTION: Branding */}
      <div style={styles.leftSection}>
        <div style={styles.brandContainer}>
          <h1 style={styles.brandTitle}>HIMALAYA TIMBER TRADERS</h1>
          <p style={styles.brandSubtitle}>Khore Pattan, Jammu and Kashmir</p>
        </div>
      </div>

      {/* RIGHT SECTION: Login Form */}
      <div style={styles.rightSection}>
        <div style={styles.formContainer}>
          <h2 style={styles.loginTitle}>Log In</h2>

          {/* Alert Box */}
          {message && (
            <div style={{ ...styles.alert, ...styles[messageType] }}>
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>
              Email
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </label>

            <label style={styles.label}>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </label>

            <button
              type="submit"
              style={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            <div style={styles.forgotPassword}>
              <a href="#forgot" style={styles.forgotLink}>
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Overlay Spinner if isLoading */}
      {isLoading && (
        <div style={styles.spinnerOverlay}>
          <div style={styles.spinner}></div>
        </div>
      )}
    </div>
  );
}

/* Inline styles */
const styles = {
  pageContainer: {
    display: "flex",
    flexDirection: "row",
    height: "100vh",
    fontFamily: "'Poppins', sans-serif",
    position: "relative", // to position spinner overlay
  },
  leftSection: {
    flex: 1,
    background: "linear-gradient(to bottom right, #2ecc71, #27ae60)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    color: "#fff",
  },
  brandContainer: {
    textAlign: "center",
    maxWidth: "300px",
  },
  brandTitle: {
    fontSize: "2.2rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    lineHeight: "1.2",
  },
  brandSubtitle: {
    fontSize: "1rem",
    opacity: 0.9,
  },
  rightSection: {
    flex: 1,
    backgroundColor: "#fefefe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  formContainer: {
    width: "100%",
    maxWidth: "350px",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
    textAlign: "center",
  },
  loginTitle: {
    marginBottom: "1.5rem",
    fontSize: "1.8rem",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    textAlign: "left",
  },
  label: {
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
    color: "#555",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    marginTop: "0.3rem",
    padding: "0.8rem",
    fontSize: "0.95rem",
    borderRadius: "4px",
    border: "1px solid #ddd",
  },
  loginButton: {
    marginTop: "1rem",
    padding: "0.9rem",
    border: "none",
    borderRadius: "4px",
    background: "linear-gradient(to bottom right, #2ecc71, #27ae60)",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  forgotPassword: {
    marginTop: "0.5rem",
    textAlign: "right",
  },
  forgotLink: {
    fontSize: "0.8rem",
    textDecoration: "none",
    color: "#27ae60",
    fontWeight: "500",
  },
  alert: {
    marginBottom: "1rem",
    padding: "0.8rem",
    borderRadius: "4px",
    textAlign: "left",
    fontSize: "0.9rem",
  },
  success: {
    backgroundColor: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
  },
  danger: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
  },
  warning: {
    backgroundColor: "#fff3cd",
    color: "#856404",
    border: "1px solid #ffeeba",
  },
  spinnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "6px solid #ccc",
    borderTopColor: "#27ae60",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

export default LoginPage;
