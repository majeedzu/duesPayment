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
    <div className="auth-split-wrapper">
      {/* Left side: Student illustration showcase */}
      <div className="auth-split-left">
        {/* Brand header at the top left */}
        <div style={{ position: "absolute", top: "2.5rem", left: "3rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="htu-logo-container" style={{ width: "38px", height: "38px" }}>
            <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
          </div>
          <div>
            <h4 style={{ color: "white", fontSize: "0.95rem", margin: 0, fontWeight: 800 }}>HTU Dues</h4>
            <span style={{ fontSize: "0.68rem", opacity: 0.85, color: "#fff", display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Finance Portal</span>
          </div>
        </div>

        <div className="auth-left-showcase" style={{ marginTop: "3rem" }}>
          <h2>Ho Technical University</h2>
          <p>
            Recover your portal account by verifying your official institutional email address.
          </p>
          <div className="auth-left-img-container">
            <img
              src="/student_paying.png"
              alt="HTU Student Paying Dues"
              className="auth-left-student-img"
            />
          </div>
        </div>
      </div>

      {/* Right side: Reset form */}
      <div className="auth-split-right">
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

        <div className="card auth-card-width" style={{ padding: "2.5rem" }}>
          
          <div style={{ marginBottom: "2rem" }}>
            {/* Mobile Only Logo */}
            <div className="auth-mobile-logo" style={{ textAlign: "center" }}>
              <div className="htu-logo-container" style={{ margin: "0 auto 1rem", width: "55px", height: "55px" }}>
                <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
              </div>
            </div>
            <h2 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", fontSize: "1.65rem", fontWeight: 800 }}>Reset Password</h2>
            <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: "0.35rem" }}>Enter your institutional email to proceed</p>
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
    </div>
  );
}
