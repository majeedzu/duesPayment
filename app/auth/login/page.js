"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Key, Mail, ShieldAlert, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
    if (emailParam) setEmail(emailParam);
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

      setClientSession(data.user);

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
      <div className="auth-split-left">
        <div className="auth-left-brand">
          <div className="htu-logo-container auth-left-logo">
            <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
          </div>
          <div>
            <h4 className="auth-left-brand-title">HTU Dues</h4>
            <span className="auth-left-brand-sub">Finance Portal</span>
          </div>
        </div>

        <div className="auth-left-showcase">
          <span className="auth-left-badge">Official student portal</span>
          <h2>Pay dues. Get cleared. Move on.</h2>
          <p>
            Sign in to view your balance, pay through Paystack, and download your stamped receipt — all in one place.
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

      <div className="auth-split-right">
        <div className="auth-mobile-hero">
          <div className="htu-logo-container auth-mobile-hero-logo">
            <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
          </div>
          <p className="auth-mobile-hero-title">Ho Technical University</p>
          <p className="auth-mobile-hero-sub">Departmental Dues Portal</p>
        </div>

        <div className="auth-panel">
          <Link href="/" className="auth-back-link">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="auth-card">
            <div className="auth-card-header">
              <h2>Welcome back</h2>
              <p>Sign in with your institutional email to continue</p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="label" htmlFor="login-email">Institutional email</label>
                <div className="auth-input-wrap">
                  <Mail className="auth-input-icon" size={18} />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="0322080456@htu.edu.gh"
                    className="input auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <span className="auth-form-hint">Must end in @htu.edu.gh</span>
              </div>

              <div className="form-group">
                <div className="auth-label-row">
                  <label className="label" htmlFor="login-password">Password</label>
                  <Link href="/auth/reset-password" className="auth-link-subtle">
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-wrap">
                  <Key className="auth-input-icon" size={18} />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="input auth-input auth-input-password"
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
                <span className="auth-form-hint">
                  First time? Use your student index number as your default password.
                </span>
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <LogIn size={18} />}
              </button>
            </form>

            <div className="auth-card-footer">
              <span>New to the portal?</span>
              <Link href="/auth/register" className="auth-link-bold">
                Activate your account
              </Link>
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
