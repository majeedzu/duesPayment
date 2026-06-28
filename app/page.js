"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  ShieldAlert, 
  Accessibility, 
  HelpCircle, 
  Phone, 
  Mail, 
  ChevronDown, 
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  LogIn,
  Users,
  Award
} from "lucide-react";

export default function Home() {
  // Verification states
  const [receiptId, setReceiptId] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState("");

  // Accessibility states (inspired by Ghana SLTF portal)
  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState("normal"); // small, normal, large
  const [readableFont, setReadableFont] = useState(false);

  // FAQ Accordion states
  const [openFaq, setOpenFaq] = useState(null);

  // Department Dues search states
  const [deptSearch, setDeptSearch] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!receiptId.trim()) return;

    setLoading(true);
    setError("");
    setVerificationResult(null);

    try {
      const res = await fetch(`/api/receipt/${encodeURIComponent(receiptId.trim())}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Receipt not found or invalid.");
      }

      setVerificationResult(data.data);
    } catch (err) {
      setError(err.message || "An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  const mockDepartments = [
    { name: "Computer Science", code: "CS", fee: 150.00, faculty: "Applied Sciences & Technology" },
    { name: "Information Technology", code: "IT", fee: 180.00, faculty: "Applied Sciences & Technology" },
    { name: "Electrical Engineering", code: "EE", fee: 220.00, faculty: "Engineering" },
    { name: "Hospitality & Tourism Mgmt", code: "HTM", fee: 200.00, faculty: "Applied Sciences & Technology" },
    { name: "Mechanical Engineering", code: "ME", fee: 210.00, faculty: "Engineering" },
    { name: "Accountancy", code: "ACC", fee: 160.00, faculty: "Business School" },
  ];

  const faqs = [
    {
      q: "How do I log into the Student Portal?",
      a: "Students must use their official Ho Technical University institutional email (e.g., indexnumber@htu.edu.gh) and the password they registered. If it is your first time, click 'Register Password' to activate your account."
    },
    {
      q: "What payment methods are supported on HTU Dues Portal?",
      a: "Through our integration with Paystack, the portal securely accepts all local Mobile Money networks (MTN Mobile Money, Telecel Cash, AT Money) and local/international Debit or Credit Cards (Visa, Mastercard)."
    },
    {
      q: "Can I print a physical copy of my receipt?",
      a: "Yes. Once payment is simulated or successfully confirmed via Paystack, a digital receipt with a unique Receipt ID and QR code is stored in your Student Dashboard. You can view, verify, and print this receipt at any time."
    },
    {
      q: "How do registration officers verify my dues status?",
      a: "Officers can scan the QR code printed on your receipt using any mobile phone or search the Receipt ID directly on the verification widget on the landing page. If the receipt is authentic, the student record and payment date will be verified immediately."
    }
  ];

  const filteredDepts = mockDepartments.filter(d => 
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) || 
    d.faculty.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(deptSearch.toLowerCase())
  );

  // Dynamic style system for accessibility
  const baseFontSize = textSize === "large" ? "19px" : textSize === "small" ? "14px" : "16px";
  const contrastTheme = highContrast ? {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    "--background": "#000000",
    "--foreground": "#FFFFFF",
    "--card-bg": "#111111",
    "--card-border": "#FFFFFF",
    "--primary": "#FFFF00", // High contrast yellow
    "--primary-hover": "#E5E500",
    "--secondary": "#00FFFF", // Cyan
    "--border": "#FFFFFF",
    "--success": "#00FF00",
    "--danger": "#FF0000",
    "--warning-bg": "#222222",
    "--info-bg": "#333333"
  } : {};

  // Custom inline style configuration for the hero layout
  const heroStyle = {
    position: "relative",
    backgroundImage: highContrast ? "none" : "url('/htu_campus_hero.png')",
    backgroundColor: highContrast ? "#000000" : "var(--primary)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    padding: "6rem 2rem",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    color: "#FFFFFF",
    marginBottom: "4rem",
    border: highContrast ? "2px solid #FFFFFF" : "none",
    boxShadow: "var(--shadow-lg)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center"
  };

  const heroOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: highContrast 
      ? "transparent" 
      : "linear-gradient(135deg, rgba(0, 55, 114, 0.93) 0%, rgba(0, 71, 173, 0.82) 100%)",
    zIndex: 1
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      fontSize: baseFontSize,
      fontFamily: readableFont ? "Arial, sans-serif" : "var(--font-sans)",
      transition: "font-size 0.2s ease",
      ...contrastTheme
    }}>
      
      {/* 1. Official Top Utility Bar (SLTF-style) */}
      <div style={{
        backgroundColor: highContrast ? "#000000" : "var(--primary)",
        color: "#FFFFFF",
        padding: "0.5rem 1.5rem",
        borderBottom: `2px solid ${highContrast ? "#FFFFFF" : "var(--accent-gold)"}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
        fontSize: "0.8rem",
        fontWeight: 600,
        zIndex: 50
      }}>
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Phone size={13} style={{ color: highContrast ? "#FFFF00" : "var(--accent-gold)" }} />
            <span>Support Hotline: +233 (0)302 751 020</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Mail size={13} style={{ color: highContrast ? "#FFFF00" : "var(--accent-gold)" }} />
            <span>finance@htu.edu.gh</span>
          </div>
          <span style={{ color: highContrast ? "#FFFF00" : "var(--accent-gold)", display: "none" }} id="htu-motto">| Adanu Nunya built on Excellence</span>
          <style jsx global>{`
            @media (min-width: 768px) {
              #htu-motto { display: inline !important; }
            }
          `}</style>
        </div>

        {/* Accessibility Toolbar (SLTF-inspired) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Accessibility size={14} style={{ color: highContrast ? "#FFFF00" : "var(--accent-gold)" }} />
            <span style={{ fontSize: "0.75rem" }}>Accessibility Tools:</span>
          </div>
          
          {/* Contrast Controls */}
          <div style={{ display: "flex", gap: "2px" }}>
            <button 
              onClick={() => setHighContrast(false)}
              style={{
                padding: "2px 6px",
                fontSize: "0.7rem",
                cursor: "pointer",
                backgroundColor: !highContrast ? "#FFFFFF" : "#333",
                color: !highContrast ? "#000" : "#FFF",
                border: "1px solid #FFF",
                borderRadius: "3px",
                fontWeight: 700
              }}
              title="Standard Mode"
            >
              Standard
            </button>
            <button 
              onClick={() => setHighContrast(true)}
              style={{
                padding: "2px 6px",
                fontSize: "0.7rem",
                cursor: "pointer",
                backgroundColor: highContrast ? "#FFFF00" : "#333",
                color: "#000",
                border: "1px solid #FFF",
                borderRadius: "3px",
                fontWeight: 700
              }}
              title="High Contrast Mode"
            >
              Contrast
            </button>
          </div>

          {/* Text Resize Controls */}
          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
            <button 
              onClick={() => setTextSize("small")}
              style={{
                padding: "2px 6px",
                fontSize: "0.7rem",
                cursor: "pointer",
                backgroundColor: textSize === "small" ? "#FFF" : "#333",
                color: textSize === "small" ? "#000" : "#FFF",
                border: "none",
                borderRadius: "3px",
                fontWeight: 700
              }}
            >
              A-
            </button>
            <button 
              onClick={() => setTextSize("normal")}
              style={{
                padding: "2px 6px",
                fontSize: "0.7rem",
                cursor: "pointer",
                backgroundColor: textSize === "normal" ? "#FFF" : "#333",
                color: textSize === "normal" ? "#000" : "#FFF",
                border: "none",
                borderRadius: "3px",
                fontWeight: 700
              }}
            >
              A
            </button>
            <button 
              onClick={() => setTextSize("large")}
              style={{
                padding: "2px 6px",
                fontSize: "0.7rem",
                cursor: "pointer",
                backgroundColor: textSize === "large" ? "#FFF" : "#333",
                color: textSize === "large" ? "#000" : "#FFF",
                border: "none",
                borderRadius: "3px",
                fontWeight: 700
              }}
            >
              A+
            </button>
          </div>

          {/* Readable Font Switch */}
          <button 
            onClick={() => setReadableFont(!readableFont)}
            style={{
              padding: "2px 6px",
              fontSize: "0.7rem",
              cursor: "pointer",
              backgroundColor: readableFont ? "#FFF" : "#333",
              color: readableFont ? "#000" : "#FFF",
              border: "none",
              borderRadius: "3px",
              fontWeight: 700
            }}
          >
            Readable Font
          </button>
        </div>
      </div>

      {/* 2. Portal Alert Status Banner */}
      <div style={{
        backgroundColor: highContrast ? "#222222" : "rgba(245, 158, 11, 0.08)",
        color: highContrast ? "#FFFF00" : "var(--foreground)",
        borderBottom: `1px solid ${highContrast ? "#FFFFFF" : "rgba(245, 158, 11, 0.2)"}`,
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        fontSize: "0.85rem",
        textAlign: "center",
        zIndex: 10
      }}>
        <Calendar size={16} style={{ color: highContrast ? "#FFFF00" : "var(--accent-gold)", flexShrink: 0 }} />
        <span>
          <strong>2026/2027 Dues Clearance Window:</strong> Departmental dues clearance is fully active. Complete payment before course registration begins.
        </span>
      </div>

      {/* 3. Official Crest Header */}
      <header className="header" style={{ 
        padding: "0.75rem 2rem", 
        borderBottom: `1px solid ${highContrast ? "#FFFFFF" : "var(--border)"}`,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        backgroundColor: highContrast ? "#000" : "var(--card-bg)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Custom SVG HTU Official Crest representation */}
          <img src="/htu_logo.jpg" alt="HTU Crest Logo" width="45" height="45" style={{ borderRadius: "50%", border: "2px solid var(--accent-gold)", objectFit: "cover", flexShrink: 0 }} />
          <div>
            <h1 style={{ 
              fontSize: "1.25rem", 
              fontWeight: 800, 
              color: highContrast ? "#FFF" : "var(--primary)",
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.01em",
              margin: 0
            }}>
              HO TECHNICAL UNIVERSITY
            </h1>
            <p style={{ 
              fontSize: "0.75rem", 
              opacity: 0.7, 
              fontWeight: 700, 
              color: highContrast ? "#FFFF00" : "var(--secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: 0
            }}>
              Finance Directorate &bull; Dues Clearance Desk
            </p>
          </div>
        </div>

        <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <a href="#about" style={{ fontSize: "0.85rem", fontWeight: 600, color: highContrast ? "#FFF" : "var(--foreground)" }}>About</a>
          <a href="#how-it-works" style={{ fontSize: "0.85rem", fontWeight: 600, color: highContrast ? "#FFF" : "var(--foreground)" }}>Process Guide</a>
          <a href="#verify" style={{ fontSize: "0.85rem", fontWeight: 600, color: highContrast ? "#FFF" : "var(--foreground)" }}>Verification Desk</a>
          <a href="#tariffs" style={{ fontSize: "0.85rem", fontWeight: 600, color: highContrast ? "#FFF" : "var(--foreground)" }}>Dues Catalog</a>
          <Link href="/auth/login" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>
            Dues Portal
          </Link>
        </nav>
      </header>

      {/* Main Content Body */}
      <main style={{ flex: 1, padding: "2rem 1.5rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* SLTF-Style Institutional Hero Header (Full-width campus background) */}
        <section style={heroStyle}>
          <div style={heroOverlayStyle}></div>
          
          <div style={{ position: "relative", zIndex: 2, maxWidth: "850px", padding: "0 1rem" }}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              padding: "0.4rem 1rem", 
              backgroundColor: highContrast ? "#222" : "rgba(245, 158, 11, 0.15)", 
              border: `1px solid ${highContrast ? "#FFFFFF" : "var(--accent-gold)"}`, 
              borderRadius: "var(--radius-full)", 
              marginBottom: "1.5rem" 
            }}>
              <Award size={14} style={{ color: highContrast ? "#FFFF00" : "var(--accent-gold)" }} />
              <span style={{ 
                fontSize: "0.75rem", 
                fontWeight: 700, 
                color: highContrast ? "#FFFF00" : "#FFFFFF", 
                textTransform: "uppercase", 
                letterSpacing: "0.05em" 
              }}>
                Ho Technical University Finance Directorate
              </span>
            </div>
            
            <h2 style={{ 
              fontSize: "clamp(2rem, 5vw, 3.5rem)", 
              color: "#FFFFFF", 
              marginBottom: "1.25rem", 
              fontFamily: "var(--font-heading)",
              lineHeight: 1.15,
              fontWeight: 800,
              textShadow: highContrast ? "none" : "0 2px 8px rgba(0,0,0,0.5)"
            }}>
              Departmental Dues <br />
              <span style={{ color: highContrast ? "#FFFF00" : "var(--accent-gold)" }}>Clearance Portal</span>
            </h2>
            
            <p style={{ 
              maxWidth: "750px", 
              margin: "0 auto 2.5rem", 
              fontSize: "1.15rem", 
              opacity: 0.95, 
              lineHeight: 1.6,
              textShadow: highContrast ? "none" : "0 1px 4px rgba(0,0,0,0.5)"
            }}>
              The secure, official web portal for department-level dues payments at HTU. Activate your account using your institutional student email, complete payments via Mobile Money or Credit/Debit Cards, and instantly verify your electronic clearance certificate.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/auth/login" className="btn btn-accent" style={{ 
                  padding: "1rem 2.5rem", 
                  fontSize: "1.05rem", 
                  boxShadow: highContrast ? "none" : "0 4px 15px rgba(245, 158, 11, 0.4)",
                  backgroundColor: highContrast ? "#FFFF00" : "var(--accent-gold)",
                  color: "#000"
                }}>
                  <LogIn size={18} /> Access Dues Portal
                </Link>
                <a href="#verify" className="btn btn-outline" style={{ 
                  padding: "1rem 2.25rem", 
                  fontSize: "1.05rem",
                  color: "#FFFFFF",
                  borderColor: "#FFFFFF"
                }}>
                  <ShieldCheck size={18} /> Verification Desk
                </a>
              </div>
              
              {/* Discreet Staff Login */}
              <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                <span style={{ opacity: 0.85 }}>Are you a clearance officer or university administrator? </span>
                <Link href="/auth/login?role=admin" style={{ 
                  color: highContrast ? "#FFFF00" : "var(--accent-gold)", 
                  fontWeight: 700,
                  textDecoration: "underline"
                }}>
                  Staff Login Portal &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About System Section (SLTF style highlights) */}
        <section id="about" style={{ marginBottom: "4rem", scrollMarginTop: "80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem", borderTop: "4px solid var(--primary)" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "var(--radius)", 
                backgroundColor: highContrast ? "#222" : "rgba(0, 55, 114, 0.08)", 
                color: highContrast ? "#FFFF00" : "var(--primary)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center"
              }}>
                <CreditCard size={24} />
              </div>
              <h3 style={{ color: "var(--primary)", fontSize: "1.2rem", fontFamily: "var(--font-heading)" }}>Integrated Payments</h3>
              <p style={{ fontSize: "0.9rem", opacity: 0.8, lineHeight: 1.6 }}>
                Secure integration with Paystack allows seamless collection via mobile money networks (MTN MoMo, Telecel Cash, AT Money) and debit/credit cards.
              </p>
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem", borderTop: "4px solid var(--accent-gold)" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "var(--radius)", 
                backgroundColor: highContrast ? "#222" : "rgba(245, 158, 11, 0.08)", 
                color: highContrast ? "#FFFF00" : "var(--accent-gold)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center"
              }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ color: "var(--primary)", fontSize: "1.2rem", fontFamily: "var(--font-heading)" }}>Real-Time Verification</h3>
              <p style={{ fontSize: "0.9rem", opacity: 0.8, lineHeight: 1.6 }}>
                Instantly matches unique receipt IDs and digital credentials with student payment profiles. Registration officers scan QR codes to confirm status.
              </p>
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem", borderTop: "4px solid var(--success)" }}>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "var(--radius)", 
                backgroundColor: highContrast ? "#222" : "rgba(16, 185, 129, 0.08)", 
                color: highContrast ? "#FFFF00" : "var(--success)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center"
              }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ color: "var(--primary)", fontSize: "1.2rem", fontFamily: "var(--font-heading)" }}>Instant Hold Clearance</h3>
              <p style={{ fontSize: "0.9rem", opacity: 0.8, lineHeight: 1.6 }}>
                Your payment records update the clearance status immediately. The system generates a digital stamped clearance slip to complete university registration.
              </p>
            </div>
          </div>
        </section>

        {/* Step-by-Step Payment Walkthrough */}
        <section id="how-it-works" style={{ marginBottom: "4rem", scrollMarginTop: "80px" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: highContrast ? "#FFFF00" : "var(--accent-gold)" }}>System Walkthrough</span>
            <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--primary)", fontSize: "1.75rem", marginTop: "0.25rem" }}>
              How to Clear Your Dues in 3 Steps
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            <div className="card" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", padding: "2.5rem 1.5rem" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: highContrast ? "#222" : "rgba(0, 55, 114, 0.08)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
                1
              </div>
              <h4 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "0.75rem", fontSize: "1.1rem" }}>1. Validate & Login</h4>
              <p style={{ fontSize: "0.85rem", opacity: 0.75, lineHeight: 1.6 }}>
                Log in using your official student email ending in <code>@htu.edu.gh</code>. If you are a first-time user, activate your account by setting up a secure password.
              </p>
            </div>

            <div className="card" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", padding: "2.5rem 1.5rem" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: highContrast ? "#222" : "rgba(245, 158, 11, 0.1)", color: "var(--accent-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
                2
              </div>
              <h4 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "0.75rem", fontSize: "1.1rem" }}>2. Complete Dues Checkout</h4>
              <p style={{ fontSize: "0.85rem", opacity: 0.75, lineHeight: 1.6 }}>
                View your outstanding department fees in the dashboard. Choose Paystack checkouts to make actual payments or use Sandbox simulation to authorize payments.
              </p>
            </div>

            <div className="card" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", padding: "2.5rem 1.5rem" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: highContrast ? "#222" : "rgba(16, 185, 129, 0.1)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
                3
              </div>
              <h4 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "0.75rem", fontSize: "1.1rem" }}>3. Institutional Clearance</h4>
              <p style={{ fontSize: "0.85rem", opacity: 0.75, lineHeight: 1.6 }}>
                Instantly download your official stamped digital receipt. Registration officers can verify your clearance by receipt ID or by scanning the receipt QR code.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Receipt Verification Widget (Search Box) */}
        <section id="verify" className="card" style={{ 
          padding: "2.5rem", 
          marginBottom: "4rem", 
          scrollMarginTop: "100px", 
          borderLeft: `5px solid ${highContrast ? "#FFFFFF" : "var(--success)"}` 
        }}>
          <div style={{ maxWidth: "750px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center", marginBottom: "0.75rem" }}>
              <ShieldCheck size={26} style={{ color: "var(--success)" }} />
              <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", fontSize: "1.5rem", margin: 0 }}>
                Clearance Verification Desk
              </h3>
            </div>
            <p style={{ opacity: 0.8, fontSize: "0.9rem", textAlign: "center", marginBottom: "2rem" }}>
              Confirm student dues status in real-time. Enter a Receipt ID or Paystack payment reference below to query the university dues ledger database.
            </p>

            <form onSubmit={handleVerify} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
                <Search style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--foreground)", opacity: 0.4 }} size={18} />
                <input
                  type="text"
                  placeholder="Enter Receipt ID or Ref (e.g. REC-HTU-296204-89617)"
                  className="input"
                  style={{ paddingLeft: "2.5rem", border: "1px solid var(--border)" }}
                  value={receiptId}
                  onChange={(e) => setReceiptId(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ minWidth: "160px" }} disabled={loading}>
                {loading ? "Searching..." : "Verify Status"}
              </button>
            </form>

            {error && (
              <div className="badge badge-danger" style={{ display: "flex", width: "100%", padding: "1rem", borderRadius: "var(--radius)", textTransform: "none", fontSize: "0.9rem", alignItems: "center", gap: "0.5rem" }}>
                <XCircle size={18} />
                <div>
                  <strong>Verification Failed:</strong> <span>{error}</span>
                </div>
              </div>
            )}

            {verificationResult && (
              <div style={{ 
                border: "1px solid var(--success)", 
                backgroundColor: "var(--success-bg)", 
                borderRadius: "var(--radius)", 
                padding: "1.75rem", 
                animation: "modalEnter 0.3s ease",
                marginTop: "1.5rem",
                boxShadow: "var(--shadow-sm)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)", fontWeight: 700, fontSize: "1.05rem", marginBottom: "1.25rem" }}>
                  <CheckCircle size={20} />
                  <span>Dues Cleared & Stamped (Record Authentic)</span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", fontSize: "0.85rem" }}>
                  <div>
                    <span style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Student Full Name</span>
                    <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--foreground)", marginTop: "2px" }}>{verificationResult.students?.full_name}</p>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Index Number</span>
                    <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--foreground)", marginTop: "2px" }}>{verificationResult.students?.index_number}</p>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Academic Programme</span>
                    <p style={{ fontWeight: 600, color: "var(--foreground)", marginTop: "2px" }}>{verificationResult.students?.programme} (Level {verificationResult.students?.level})</p>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Amount Paid</span>
                    <p style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1rem", marginTop: "2px" }}>GHS {parseFloat(verificationResult.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Clearance Receipt ID</span>
                    <p style={{ fontWeight: 700, color: "var(--secondary)", fontFamily: "monospace", marginTop: "2px" }}>{verificationResult.receipt_id}</p>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Paystack Reference</span>
                    <p style={{ fontWeight: 600, fontFamily: "monospace", opacity: 0.9, marginTop: "2px" }}>{verificationResult.paystack_reference}</p>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Date Cleared</span>
                    <p style={{ fontWeight: 600, color: "var(--foreground)", marginTop: "2px" }}>{new Date(verificationResult.payment_date).toLocaleString()}</p>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>Verification Authority</span>
                    <p style={{ fontWeight: 700, color: "var(--success)", marginTop: "2px" }}>HTU Finance Director</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 5. Interactive Dues Catalog */}
        <section id="tariffs" style={{ marginBottom: "4rem", scrollMarginTop: "80px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: highContrast ? "#FFFF00" : "var(--accent-gold)" }}>Tariff Guide</span>
              <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--primary)", fontSize: "1.75rem", marginTop: "0.25rem" }}>
                Official Departmental Dues Schedule
              </h3>
            </div>
            
            <div style={{ position: "relative", minWidth: "280px" }}>
              <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
              <input
                type="text"
                placeholder="Search department, code, or faculty..."
                className="input"
                style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.85rem" }}
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Code</th>
                  <th>Department Name</th>
                  <th>Faculty Placement</th>
                  <th style={{ textAlign: "right", width: "180px" }}>Dues Tariff</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "2.5rem", opacity: 0.6 }}>No matching departments found.</td>
                  </tr>
                ) : (
                  filteredDepts.map((dept, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{dept.code}</td>
                      <td style={{ fontWeight: 600, color: "var(--foreground)" }}>{dept.name}</td>
                      <td style={{ fontSize: "0.85rem", opacity: 0.8 }}>{dept.faculty}</td>
                      <td style={{ fontWeight: 800, color: "var(--primary)", textAlign: "right", fontSize: "0.95rem" }}>
                        GHS {dept.fee.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. FAQ Accordion Section */}
        <section style={{ maxWidth: "850px", margin: "0 auto 4rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: highContrast ? "#FFFF00" : "var(--accent-gold)" }}>Help Desk</span>
            <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--primary)", fontSize: "1.75rem", marginTop: "0.25rem" }}>
              Frequently Asked Questions
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className="card" 
                style={{ 
                  padding: "1.25rem 1.5rem", 
                  cursor: "pointer",
                  transition: "var(--transition-fast)"
                }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: "0.95rem", color: "var(--primary)", margin: 0, fontWeight: 700 }}>{faq.q}</h4>
                  <ChevronDown 
                    size={16} 
                    style={{ 
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0)", 
                      transition: "var(--transition-fast)",
                      opacity: 0.6
                    }} 
                  />
                </div>
                {openFaq === i && (
                  <p style={{ 
                    marginTop: "0.75rem", 
                    fontSize: "0.85rem", 
                    opacity: 0.8, 
                    lineHeight: 1.6,
                    borderTop: "1px solid var(--border)",
                    paddingTop: "0.75rem",
                    animation: "modalEnter 0.2s ease"
                  }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* 7. Structured Institutional Footer (SLTF inspired) */}
      <footer style={{ 
        backgroundColor: highContrast ? "#000" : "var(--primary)", 
        color: "#ffffff", 
        borderTop: `4px solid ${highContrast ? "#FFFFFF" : "var(--accent-gold)"}`,
        padding: "4rem 2rem 2rem",
        zIndex: 10
      }}>
        <div style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
          gap: "2.5rem",
          marginBottom: "3rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <img src="/htu_logo.jpg" alt="HTU Crest Logo" width="30" height="30" style={{ borderRadius: "50%", border: "1.5px solid var(--accent-gold)", objectFit: "cover" }} />
              <h4 style={{ fontFamily: "var(--font-heading)", color: highContrast ? "#FFFF00" : "var(--accent-gold)", margin: 0, fontSize: "1.1rem" }}>
                Ho Technical University
              </h4>
            </div>
            <p style={{ fontSize: "0.8rem", opacity: 0.75, lineHeight: 1.6 }}>
              The premier career-focused technical institution in Volta Region, Ghana. Empowering students with cutting-edge academic education and practical skills training.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: "0.95rem", color: highContrast ? "#FFFF00" : "var(--accent-gold)", marginBottom: "1.25rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Portal Access
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
              <Link href="/auth/login" style={{ opacity: 0.85, textDecoration: "underline" }}>Dues Portal Log In</Link>
              <Link href="/auth/register" style={{ opacity: 0.85, textDecoration: "underline" }}>First-time Activation</Link>
              <Link href="/auth/login?role=admin" style={{ opacity: 0.85, textDecoration: "underline" }}>Department Admin Desk</Link>
              <Link href="/auth/login?role=super" style={{ opacity: 0.85, textDecoration: "underline" }}>Super Admin Console</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "0.95rem", color: highContrast ? "#FFFF00" : "var(--accent-gold)", marginBottom: "1.25rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Contacts
            </h4>
            <p style={{ fontSize: "0.8rem", opacity: 0.75, lineHeight: 1.6, marginBottom: "0.5rem" }}>
              Finance Directorate, Main Campus<br />
              P.O. Box HP 217, Ho, Volta Region, Ghana
            </p>
            <p style={{ fontSize: "0.8rem", opacity: 0.75 }}>
              General Enquiries: +233 (0)362 026 123<br />
              Email: support-finance@htu.edu.gh
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: "0.95rem", color: highContrast ? "#FFFF00" : "var(--accent-gold)", marginBottom: "1.25rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Portal Compliance
            </h4>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.75rem", opacity: 0.75, lineHeight: 1.45 }}>
              <Info size={18} style={{ color: highContrast ? "#FFFF00" : "var(--accent-gold)", flexShrink: 0, marginTop: "2px" }} />
              <p>
                Payments on this portal comply with the HTU Student Representative Council (SRC) financial statutes and Ho Technical University board guidelines.
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          borderTop: "1px solid rgba(255,255,255,0.1)", 
          paddingTop: "1.5rem",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: "1rem",
          fontSize: "0.8rem",
          opacity: 0.6
        }}>
          <span>&copy; {new Date().getFullYear()} Ho Technical University. All Rights Reserved.</span>
          <span>Developed by HTU Information &amp; Communication Technology Directorate</span>
        </div>
      </footer>

    </div>
  );
}
