"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to initiate password reset.");
      }

      setSuccess("A password reset link has been simulated & logged! Check your inbox.");
    } catch (err) {
      setError(err.message || "An error occurred. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      background: "radial-gradient(circle at 10% 20%, rgba(0, 55, 114, 0.05) 0%, rgba(0, 71, 173, 0.02) 90.1%)",
      padding: "2rem 1rem"
    }}>

      <Link href="/auth/login" style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "0.5rem", 
        color: "var(--primary)", 
        fontWeight: 600,
        marginBottom: "2rem"
      }}>
        <ArrowLeft size={16} /> Back to Login
      </Link>

      <div className="card" style={{ maxWidth: "450px", width: "100%", padding: "2.5rem" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="sidebar-logo" style={{ margin: "0 auto 1rem", width: "50px", height: "50px", fontSize: "1.4rem" }}>HTU</div>
          <h2 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Reset Password</h2>
          <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: "0.25rem" }}>Enter your institutional email to proceed</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ 
            display: "flex", 
            width: "100%", 
            padding: "0.75rem 1rem", 
            borderRadius: "var(--radius)", 
            textTransform: "none", 
            fontSize: "0.85rem", 
            alignItems: "center", 
            gap: "0.5rem",
            marginBottom: "1.5rem"
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="badge badge-success" style={{ 
            display: "flex", 
            width: "100%", 
            padding: "0.75rem 1rem", 
            borderRadius: "var(--radius)", 
            textTransform: "none", 
            fontSize: "0.85rem", 
            alignItems: "center", 
            gap: "0.5rem",
            marginBottom: "1.5rem"
          }}>
            <ShieldCheck size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="label">Institutional Email</label>
            <div style={{ position: "relative" }}>
              <Mail style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
              <input
                type="email"
                placeholder="username@htu.edu.gh"
                className="input"
                style={{ paddingLeft: "2.5rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? "Sending link..." : "Send Reset Link"}
          </button>
        </form>

      </div>
    </div>
  );
}
