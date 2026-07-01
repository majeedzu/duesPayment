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
        {/* Centered Logo Header */}
        <div className="auth-left-logo-centered">
          <div className="htu-logo-container auth-left-logo-icon" style={{ marginBottom: '0.5rem' }}>
            <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
          </div>
          <div>
            <span className="auth-left-brand-sub">Official Finance Portal</span>
          </div>
        </div>

        <div className="auth-left-showcase">
          <h2>Recover Your Account.</h2>
          <p>
            Recover your portal account by verifying your official institutional email address.
          </p>
          
          <div className="auth-illustration-container">
            <div className="auth-mock-card" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div className="auth-mock-header">
                <div className="auth-mock-chip" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}></div>
                <span className="auth-mock-value" style={{ color: '#ffffff' }}>Verify Email</span>
              </div>
              <div className="auth-mock-body">
                <div className="auth-mock-row" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}></div>
                <div className="auth-mock-row auth-mock-row-short" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Reset form */}
      <div className="auth-split-right">
        {/* Mobile Header Hero (Visible only on mobile screen widths) */}
        <div className="auth-mobile-hero">
          <div className="htu-logo-container auth-mobile-hero-logo">
            <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
          </div>
          <p className="auth-mobile-hero-sub">Departmental Finance Portal</p>
          <div className="auth-mobile-hero-badge">
            <ShieldCheck size={12} style={{ color: '#FFD700' }} />
            <span>HTU Official Portal</span>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-card">
            
            <div style={{ marginBottom: "1.75rem" }}>
              <h2 style={{ color: "#111827", fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px" }}>
                Reset Password
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#4B5563", margin: 0 }}>
                Enter your institutional email to proceed
              </p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                display: "flex",
                gap: "0.75rem",
                width: "100%",
                padding: "1rem 1.25rem",
                borderRadius: "12px",
                fontSize: "0.85rem",
                lineHeight: "1.5",
                marginBottom: "1.25rem",
                background: "rgba(5, 150, 105, 0.1)",
                color: "#059669",
                border: "1px solid rgba(5, 150, 105, 0.2)"
              }}>
                <ShieldCheck size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" style={{ gap: "1rem" }}>
              <div className="form-group">
                <label className="label" htmlFor="reset-email" style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600' }}>
                  Institutional Email
                </label>
                <div className="auth-input-wrap">
                  <Mail className="auth-input-icon" size={18} style={{ color: '#98A2B3' }} />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="username@htu.edu.gh"
                    className="input auth-input"
                    style={{ background: '#EEF3FF', border: 'none', height: '48px', borderRadius: '8px', paddingLeft: '2.75rem' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  background: '#00008C',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s',
                  marginTop: '0.5rem'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#00005E'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#00008C'; }}
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>

            {/* Back to Login Link */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <Link href="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#00008C'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#6B7280'; }}
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>

            {/* Official Footer Details */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem', fontSize: '0.75rem', color: '#98A2B3' }}>
              <p style={{ margin: 0, fontWeight: '500' }}>©2026 HTU</p>
              <p style={{ margin: '4px 0 0', fontWeight: '500' }}>E-mail: info@htu.edu.gh</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
