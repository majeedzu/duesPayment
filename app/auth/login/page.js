"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Key, Mail, ShieldAlert, ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { setClientSession } from "@/lib/session";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) Promise.resolve().then(() => setEmail(emailParam));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.needRegistration) {
          router.push(`/auth/register?email=${encodeURIComponent(email)}`);
          return;
        }
        throw new Error(data.message || "Invalid login credentials.");
      }

      setClientSession({ ...data.user, mustChangePassword: data.mustChangePassword });

      const role = data.user.role;
      if (role === "super_admin") {
        router.push("/super-admin/dashboard");
      } else if (role === "dept_admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err) {
      setError(err.message || "Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-split-card">
        {/* Left Branding Side (45% width) */}
        <div className="auth-split-left" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", textAlign: "center" }}>
            <div className="htu-logo-container" style={{ width: "160px", height: "160px", borderRadius: "12px", overflow: "hidden", border: "4px solid rgba(255, 255, 255, 0.4)", boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)", backgroundColor: "#ffffff" }}>
              <img src="/htu_logo.jpg" alt="HTU Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#ffffff", fontFamily: "var(--font-heading)" }}>Ho Technical University</h2>
              <p style={{ fontSize: "0.95rem", opacity: 0.9, color: "rgba(255, 255, 255, 0.8)", maxWidth: "320px", margin: "0 auto" }}>Official Departmental Dues Portal</p>
            </div>
          </div>
        </div>

        {/* Right Form Column (55% width) - Styled like HTU portal */}
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
                <h2 style={{ color: "#111827", fontFamily: "var(--font-heading)", fontSize: "1.50rem", fontWeight: 800, margin: "0 0 4px" }}>
                  Sign In
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#4B5563", margin: 0 }}>
                  Access your departmental dues dashboard
                </p>
              </div>

              {error && (
                <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
                  <ShieldAlert size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="label" htmlFor="login-email" style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600' }}>
                    Student Email
                  </label>
                  <div className="auth-input-wrap">
                    <Mail className="auth-input-icon" size={18} />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="0322080456@htu.edu.gh"
                      className="input auth-input"
                      style={{ background: '#EEF3FF', border: 'none', height: '48px', borderRadius: '8px', paddingLeft: '2.75rem' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="login-password" style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600' }}>
                    Password
                  </label>
                  <div className="auth-input-wrap">
                    <Key className="auth-input-icon" size={18} />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      className="input auth-input auth-input-password"
                      style={{ background: '#EEF3FF', border: 'none', height: '48px', borderRadius: '8px', paddingLeft: '2.75rem' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Details Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#4B5563', userSelect: 'none' }}>
                    <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#00008C', borderRadius: '4px', cursor: 'pointer' }} />
                    Remember me
                  </label>
                  <Link href="/auth/reset-password" style={{ color: '#3457FF', fontWeight: '600', textDecoration: 'none' }}>
                    Forgot Details
                  </Link>
                </div>

                {/* Login Button (Full Width) */}
                <div style={{ marginTop: '1.5rem' }}>
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
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#00005E'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#00008C'; }}
                  >
                    {loading ? (
                      <Loader2 className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} size={18} />
                    ) : (
                      "Login"
                    )}
                  </button>
                </div>
              </form>

              {/* Back to Home Link */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.color = '#00008C'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = '#6B7280'; }}
                >
                  <ArrowLeft size={16} /> Back to home
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-loading">
          <div className="spinner" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
