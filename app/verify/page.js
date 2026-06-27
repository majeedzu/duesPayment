"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, ShieldCheck } from "lucide-react";

export default function VerifyLandingPage() {
  const router = useRouter();
  const [receiptId, setReceiptId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (receiptId.trim()) {
      router.push(`/verify/${encodeURIComponent(receiptId.trim())}`);
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
      
      {/* Back to Home Link */}
      <Link href="/" style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "0.5rem", 
        color: "var(--primary)", 
        fontWeight: 600,
        marginBottom: "2rem"
      }}>
        <ArrowLeft size={16} /> Back to Landing Page
      </Link>

      <div className="card" style={{ maxWidth: "500px", width: "100%", padding: "2.5rem" }}>
        
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ 
            width: "60px", 
            height: "60px", 
            backgroundColor: "rgba(16, 185, 129, 0.1)", 
            color: "var(--success)", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 1rem"
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Verify Receipt Authenticity</h2>
          <p style={{ opacity: 0.7, fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Enter a Receipt ID to verify its validity in the HTU database.
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="label">Receipt ID</label>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
              <input
                type="text"
                placeholder="e.g., REC-HTU-2026-999-55A"
                className="input"
                style={{ paddingLeft: "2.5rem" }}
                value={receiptId}
                onChange={(e) => setReceiptId(e.target.value)}
                required
              />
            </div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>Receipt IDs are formatted as REC-HTU-XXXXXX-XXXXX</span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
            Verify Receipt <Search size={16} />
          </button>
        </form>

      </div>
    </div>
  );
}
