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
          // Direct to registration
          router.push(`/auth/register?email=${encodeURIComponent(email)}`);
          return;
        }
        throw new Error(data.message || "Invalid login credentials.");
      }

      // Store in session cookie
      setClientSession(data.user);

      // Redirect to appropriate dashboard based on role
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

  // Helper to instantly load preset accounts for mock testing
  const handleQuickLogin = (presetEmail) => {
    setEmail(presetEmail);
    setPassword("password123");
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
      
      {/* Back to Home Link */}
      <Link href="/" style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "0.5rem", 
        color: "var(--primary)", 
        fontWeight: 600,
        marginBottom: "2rem",
        alignSelf: "center"
      }}>
        <ArrowLeft size={16} /> Back to Landing Page
      </Link>

      <div className="card" style={{ maxWidth: "450px", width: "100%", padding: "2.5rem" }}>
        
        {/* Portal Branding */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src="/htu_logo.jpg" alt="HTU Logo" style={{ margin: "0 auto 1rem", width: "55px", height: "55px", borderRadius: "50%", border: "2.5px solid var(--accent-gold)", objectFit: "cover", display: "block" }} />
          <h2 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Ho Technical University</h2>
          <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: "0.25rem" }}>Departmental Dues Portal</p>
        </div>

        {/* Error Alert */}
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="label">Institutional Email</label>
            <div style={{ position: "relative" }}>
              <Mail style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
              <input
                type="email"
                placeholder="0322080456@htu.edu.gh"
                className="input"
                style={{ paddingLeft: "2.5rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>Must end in @htu.edu.gh</span>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="label">Password</label>
              <Link href="/auth/reset-password" style={{ fontSize: "0.8rem", color: "var(--secondary)", fontWeight: 500 }}>
                Forgot?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <Key style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="input"
                style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  opacity: 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem", display: "block" }}>
              First-time login? Use your student index number as your default password.
            </span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? "Signing In..." : "Sign In"} <LogIn size={18} />
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          <span>First-time user? </span>
          <Link href="/auth/register" style={{ color: "var(--primary)", fontWeight: 700 }}>
            Register Password
          </Link>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyCenter: "center", display: "flex", justifyContent: "center", backgroundColor: "var(--background)" }}>
        <div className="spinner"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
