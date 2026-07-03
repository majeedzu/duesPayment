"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, XCircle, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";

function VerifyContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/receipt/${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.message || "Receipt not found or payment not confirmed.");
        }
      })
      .catch(() => setError("Failed to verify receipt. Please try again."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--background)",
      padding: "1.5rem"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <div className="htu-logo-container" style={{ width: "42px", height: "42px" }}>
          <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)", margin: 0, fontFamily: "var(--font-heading)" }}>
            HTU Dues Portal
          </h1>
          <p style={{ fontSize: "0.75rem", opacity: 0.6, margin: 0 }}>Receipt Verification</p>
        </div>
      </div>

      <div className="card" style={{ width: "100%", maxWidth: "540px", padding: "2rem" }}>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem 0" }}>
            <Loader2 size={36} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
            <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>Verifying receipt...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "var(--danger-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <XCircle size={32} style={{ color: "var(--danger)" }} />
            </div>
            <h2 style={{ color: "var(--danger)", fontFamily: "var(--font-heading)", marginBottom: "0.5rem" }}>Verification Failed</h2>
            <p style={{ fontSize: "0.9rem", opacity: 0.7, lineHeight: 1.6, marginBottom: "1.5rem" }}>{error}</p>
            <Link href="/" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <ArrowLeft size={16} /> Back to Portal
            </Link>
          </div>
        )}

        {!loading && result && (
          <div>
            {/* Success header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--success-bg)", borderRadius: "var(--radius)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <CheckCircle size={28} style={{ color: "var(--success)", flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 800, color: "var(--success)", margin: 0, fontSize: "1rem" }}>Dues Cleared — Record Authentic</p>
                <p style={{ fontSize: "0.78rem", opacity: 0.75, margin: 0, marginTop: "2px" }}>This receipt is valid and confirmed in the HTU payment system.</p>
              </div>
            </div>

            {/* Receipt details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {[
                { label: "Student Full Name", value: result.students?.full_name },
                { label: "Index Number", value: result.students?.index_number },
                { label: "Programme", value: result.students?.programme ? `${result.students.programme} (Level ${result.students.level})` : "—" },
                { label: "Amount Paid", value: `GHS ${parseFloat(result.amount).toFixed(2)}`, highlight: true },
                { label: "Receipt ID", value: result.receipt_id, mono: true },
                { label: "Paystack Reference", value: result.paystack_reference, mono: true },
                { label: "Payment Date", value: result.payment_date ? new Date(result.payment_date).toLocaleString() : "—" },
                { label: "Academic Period", value: result.academic_year || result.semester || "2025/2026" },
              ].map(({ label, value, highlight, mono }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.78rem", opacity: 0.55, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>{label}</span>
                  <span style={{
                    fontSize: "0.88rem",
                    fontWeight: highlight ? 800 : 600,
                    color: highlight ? "var(--primary)" : "var(--foreground)",
                    fontFamily: mono ? "monospace" : "inherit",
                    textAlign: "right"
                  }}>
                    {value || "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Verified by footer */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(var(--primary-rgb),0.04)", borderRadius: "var(--radius)", border: "1px solid rgba(var(--primary-rgb),0.1)" }}>
              <ShieldCheck size={16} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.78rem", opacity: 0.75 }}>
                Verified by <strong>HTU Finance Directorate</strong> · Ho Technical University
              </span>
            </div>

            <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
              <Link href="/" style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <ArrowLeft size={14} /> Back to Portal
              </Link>
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: "0.72rem", opacity: 0.4, marginTop: "1.5rem" }}>
        &copy; {new Date().getFullYear()} Ho Technical University
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
