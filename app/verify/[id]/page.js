"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowLeft, Loader2, ShieldCheck, Calendar, User, Hash, Building2, CreditCard } from "lucide-react";
import QRCode from "qrcode";

export default function VerifyReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const fetchReceipt = async (receiptId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receipt/${encodeURIComponent(receiptId)}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Receipt not found.");
      setData(result.data);

      // Generate QR code pointing back to this page
      const verificationUrl = `${window.location.origin}/verify/${receiptId}`;
      const qr = await QRCode.toDataURL(verificationUrl, {
        margin: 2, width: 160,
        color: { dark: "#003772", light: "#FFFFFF" }
      });
      setQrCodeUrl(qr);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      (async () => { await fetchReceipt(params.id); })();
    }
  }, [params]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexDirection: "column" }}>
        <Loader2 className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ fontWeight: 600, opacity: 0.7 }}>Verifying receipt authenticity...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>

        {/* Back button */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", fontWeight: 600, marginBottom: "2rem" }}>
          <ArrowLeft size={16} /> Back to Portal
        </Link>

        {/* Error state */}
        {error && (
          <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <XCircle size={64} style={{ color: "var(--danger)", margin: "0 auto 1rem" }} />
            <h2 style={{ color: "var(--danger)", fontFamily: "var(--font-heading)" }}>Receipt Not Found</h2>
            <p style={{ opacity: 0.7, marginTop: "0.75rem" }}>{error}</p>
            <p style={{ opacity: 0.5, fontSize: "0.85rem", marginTop: "0.5rem" }}>
              Receipt ID: <strong>{params?.id}</strong>
            </p>
            <Link href="/#verify" className="btn btn-primary" style={{ marginTop: "2rem", display: "inline-flex" }}>
              Try Another Receipt
            </Link>
          </div>
        )}

        {/* Valid Receipt */}
        {data && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ backgroundColor: "var(--success)", padding: "1.5rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <CheckCircle2 size={40} color="#FFFFFF" />
              <div>
                <h2 style={{ color: "#FFFFFF", fontFamily: "var(--font-heading)", fontSize: "1.4rem" }}>Receipt Verified & Authentic</h2>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>This receipt is valid and recorded in the HTU payments database.</p>
              </div>
            </div>

            {/* Receipt Body */}
            <div style={{ padding: "2rem" }}>

              {/* HTU Header with Logo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--primary)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#ffffff", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src="/htu_logo.jpg" alt="HTU Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                  <div>
                    <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", fontSize: "1.25rem", margin: 0, fontWeight: 800 }}>HO TECHNICAL UNIVERSITY</h3>
                    <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: "2px 0 0" }}>P. O. Box HP 217, Ho, Ghana | info@htu.edu.gh</p>
                    <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)", fontWeight: 700, marginTop: "4px" }}>Official Departmental Dues Receipt</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "end", gap: "0.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <ShieldCheck size={18} style={{ color: "var(--success)" }} />
                    <span style={{ color: "var(--success)", fontWeight: 800, fontSize: "0.85rem" }}>VERIFIED</span>
                  </div>
                  <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>HTU-SECURE-PAY</span>
                </div>
              </div>

              {/* Details Grid + QR */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: 0.5, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                      <User size={12} /> Student Name
                    </div>
                    <p style={{ fontWeight: 700 }}>{data.students?.full_name}</p>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: 0.5, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                      <Hash size={12} /> Index Number
                    </div>
                    <p style={{ fontWeight: 700 }}>{data.students?.index_number}</p>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: 0.5, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                      <Building2 size={12} /> Department
                    </div>
                    <p style={{ fontWeight: 600 }}>{data.students?.programme}</p>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: 0.5, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                      <CreditCard size={12} /> Amount Paid
                    </div>
                    <p style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1.1rem" }}>GHS {parseFloat(data.amount).toFixed(2)}</p>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: 0.5, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                      <Calendar size={12} /> Academic Period
                    </div>
                    <p style={{ fontWeight: 600 }}>{data.academic_year || '2025/2026'} &middot; {data.semester || 'Academic Year'}</p>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: 0.5, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                      <Hash size={12} /> Transaction Ref
                    </div>
                    <p style={{ fontWeight: 600, fontFamily: "monospace", fontSize: "0.85rem" }}>{data.paystack_reference}</p>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: 0.5, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                      <Calendar size={12} /> Payment Date
                    </div>
                    <p style={{ fontWeight: 600 }}>{new Date(data.payment_date).toLocaleString()}</p>
                  </div>

                </div>

                {/* QR Code & Stamped Validation Seal */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                  {qrCodeUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
                      <img src={qrCodeUrl} alt="Verification QR Code" style={{ width: "120px", height: "120px", border: "1px solid var(--border)", borderRadius: "8px", padding: "4px", backgroundColor: "#fff" }} />
                      <span style={{ fontSize: "0.65rem", opacity: 0.5, textAlign: "center" }}>Scan to re-verify</span>
                    </div>
                  )}

                  {/* Stamped Seal Block */}
                  <div style={{
                    border: "3px double #059669",
                    borderRadius: "8px",
                    color: "#059669",
                    padding: "0.5rem 0.75rem",
                    transform: "rotate(-4deg)",
                    display: "inline-block",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    textAlign: "center",
                    lineHeight: "1.3",
                    textTransform: "uppercase",
                    backgroundColor: "rgba(5, 150, 105, 0.03)",
                    boxShadow: "0 4px 10px rgba(5, 150, 105, 0.05)"
                  }}>
                    HTU FINANCE<br/>
                    ★ VERIFIED ★<br/>
                    {data.payment_date ? new Date(data.payment_date).toLocaleDateString() : new Date().toLocaleDateString()}<br/>
                    <span style={{ fontSize: "0.6rem", opacity: 0.8 }}>ID: {data.receipt_id?.slice(0, 8)}</span>
                  </div>
                </div>
              </div>

              {/* Receipt ID stamp */}
              <div style={{ marginTop: "2rem", backgroundColor: "rgba(var(--primary-rgb), 0.04)", border: "1px dashed var(--border)", borderRadius: "var(--radius)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <p style={{ fontSize: "0.75rem", opacity: 0.6, textTransform: "uppercase", fontWeight: 700 }}>Receipt Verification ID</p>
                  <p style={{ fontWeight: 800, color: "var(--secondary)", fontFamily: "monospace", fontSize: "1rem" }}>{data.receipt_id}</p>
                </div>
                <span className="badge badge-success">Payment Verified</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
