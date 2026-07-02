"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Key, ShieldCheck, ShieldAlert, ArrowLeft, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Whether we have received the PASSWORD_RECOVERY session from Supabase
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // No Supabase — allow the mock form immediately
      setSessionReady(true);
      setSessionChecking(false);
      return;
    }

    // Supabase automatically parses the #access_token fragment from the URL
    // and fires PASSWORD_RECOVERY via onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
        setSessionChecking(false);
      } else if (event === "SIGNED_IN" && session) {
        // Already signed in (e.g. token already exchanged) — allow form
        setSessionReady(true);
        setSessionChecking(false);
      }
    });

    // Fallback: also check current session in case the event already fired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setSessionChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { error: resetError } = await supabase.auth.updateUser({
          password: password,
        });

        if (resetError) {
          throw new Error(resetError.message);
        }

        setSuccess("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        // Simulated local fallback
        setSuccess("Mock password updated successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to update password. Link may have expired.");
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
          <h2>Secure Your Account.</h2>
          <p>
            Choose a strong, secure password to protect your payment account and credentials.
          </p>
          
          <div className="auth-illustration-container">
            <div className="auth-mock-card" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div className="auth-mock-header">
                <div className="auth-mock-chip" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}></div>
                <span className="auth-mock-value" style={{ color: '#ffffff' }}>Save Password</span>
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
                Create New Password
              </h2>
              <p style={{ fontSize: "0.9rem", color: "#4B5563", margin: 0 }}>
                Set a new password for your HTU portal account
              </p>
            </div>

            {sessionChecking && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "2rem 0", color: "#6B7280", fontSize: "0.9rem" }}>
                <Loader2 className="spinner" size={20} style={{ animation: "spin 1s linear infinite" }} />
                <span>Verifying your reset link...</span>
              </div>
            )}

            {!sessionChecking && !sessionReady && (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: '1.25rem', justifyContent: "center" }}>
                  <ShieldAlert size={16} />
                  <span>This reset link is invalid or has expired. Please request a new one.</span>
                </div>
                <Link href="/auth/reset-password" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#00008C", fontSize: "0.9rem", fontWeight: 700 }}>
                  Request a new reset link →
                </Link>
              </div>
            )}

            {!sessionChecking && sessionReady && (
              <>
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
                  <div className="form-group" style={{ position: "relative" }}>
                    <label className="label" htmlFor="new-password" style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600' }}>
                      New Password
                    </label>
                    <div className="auth-input-wrap" style={{ position: "relative" }}>
                      <Key className="auth-input-icon" size={18} style={{ color: '#98A2B3' }} />
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••"
                        className="input auth-input"
                        style={{ background: '#EEF3FF', border: 'none', height: '48px', borderRadius: '8px', paddingLeft: '2.75rem', width: '100%' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', zIndex: 10 }}
                      >
                        {showPassword ? <EyeOff size={18} style={{ color: '#98A2B3' }} /> : <Eye size={18} style={{ color: '#98A2B3' }} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="confirm-password" style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600' }}>
                      Confirm Password
                    </label>
                    <div className="auth-input-wrap">
                      <Key className="auth-input-icon" size={18} style={{ color: '#98A2B3' }} />
                      <input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••"
                        className="input auth-input"
                        style={{ background: '#EEF3FF', border: 'none', height: '48px', borderRadius: '8px', paddingLeft: '2.75rem', width: '100%' }}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {loading ? <><Loader2 className="spinner animate-spin" size={18} /> Updating...</> : <><Lock size={16} /> Update Password</>}
                  </button>
                </form>
              </>
            )}

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

