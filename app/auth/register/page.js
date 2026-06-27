"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus, Mail, Key, ShieldCheck, ArrowLeft, ShieldAlert } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register account.");
      }

      setSuccess("Account registered successfully! Redirecting to login...");
      setTimeout(() => {
        router.push(`/auth/login?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err.message || "An error occurred during registration.");
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
          <h2 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Student Registration</h2>
          <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: "0.25rem" }}>Activate your portal account</p>
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
                placeholder="0322080456@htu.edu.gh"
                className="input"
                style={{ paddingLeft: "2.5rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>Your departmental admin must import your email via CSV first.</span>
          </div>

          <div className="form-group">
            <label className="label">Set Password</label>
            <div style={{ position: "relative" }}>
              <Key style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                className="input"
                style={{ paddingLeft: "2.5rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <Key style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
              <input
                type="password"
                placeholder="Confirm password"
                className="input"
                style={{ paddingLeft: "2.5rem" }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? "Activating..." : "Activate Account"} <UserPlus size={18} />
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          <span>Already activated? </span>
          <Link href="/auth/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)" }}>
        <div className="spinner"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
