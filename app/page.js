"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  CheckCircle,
  XCircle,
  CreditCard,
  Accessibility,
  Phone,
  Mail,
  ChevronDown,
  Info,
  Calendar,
  Sparkles,
  LogIn,
  Award,
  Menu,
  X,
  BookOpen,
  Receipt,
  GraduationCap
} from "lucide-react";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#verify", label: "Verify receipt" },
  { href: "#tariffs", label: "Dues fees" },
  { href: "#faq", label: "Help" },
];

const PORTAL_FEATURES = [
  {
    title: "Mobile Payments",
    desc: "Pay with MTN MoMo, Telecel Cash, AT Money, or debit/credit cards.",
    icon: CreditCard,
    iconTone: "primary",
  },
  {
    title: "Registry Sync",
    desc: "Clearance updates automatically on the course registration portal.",
    icon: CheckCircle,
    iconTone: "success",
  },
  {
    title: "Receipt Vault",
    desc: "View, verify, and download stamped receipts from your dashboard.",
    icon: Receipt,
    iconTone: "info",
  },
  {
    title: "Secure Check",
    desc: "Officers verify payments instantly via QR scan or receipt ID.",
    icon: ShieldCheck,
    iconTone: "violet",
  },
  {
    title: "All Departments",
    desc: "Every faculty supported — Applied Sciences, Engineering, Business, and more.",
    icon: BookOpen,
    iconTone: "cyan",
  },
  {
    title: "Finance Support",
    desc: "Reach department finance officers when you need help or updates.",
    icon: Phone,
    iconTone: "crimson",
  },
];


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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("htu-dues-theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("htu-dues-theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("htu-dues-theme", "light");
    }
  }, [darkMode]);

  // FAQ accordion states
  const [openFaq, setOpenFaq] = useState(null);

  // Department Dues search states
  const [deptSearch, setDeptSearch] = useState("");

  // Fetch live departments on mount
  useEffect(() => {
    fetch("/api/super-admin/departments-public")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.departments) {
          setDepartments(data.departments);
        }
      })
      .catch(() => {})
      .finally(() => setDeptsLoading(false));
  }, []);
  // Floating panel open state
  const [floatingPanelOpen, setFloatingPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  // Scroll animations trigger
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-active");
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll(".reveal-init").forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.faculty.toLowerCase().includes(deptSearch.toLowerCase())
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
    "--primary": "#FF4444",    // Bright accessible red
    "--primary-hover": "#CC2222",
    "--secondary": "#FFFFFF",
    "--border": "#FFFFFF",
    "--success": "#00FF88",
    "--danger": "#FF4444",
    "--warning-bg": "#222222",
    "--info-bg": "#333333"
  } : {};


  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div
      className="landing-page"
      style={{
        fontSize: baseFontSize,
        fontFamily: readableFont ? "Arial, sans-serif" : "var(--font-sans)",
        transition: "font-size 0.2s ease",
        ...contrastTheme
      }}
    >

      {/* Floating accessibility & contact */}
      <div className="landing-fab-wrap">
        {/* Slide-out panel */}
        {floatingPanelOpen && (
          <div style={{
            background: highContrast ? "#000" : (darkMode ? "rgba(15, 23, 42, 0.97)" : "rgba(255,255,255,0.97)"),
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${highContrast ? "#fff" : (darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,140,0.12)")}`,
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            minWidth: "280px",
            maxWidth: "320px",
            animation: "modalEnter 0.25s cubic-bezier(0.34,1.56,0.64,1)"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <span style={{ fontWeight: 800, fontSize: "0.85rem", color: highContrast ? "#FF6B6B" : (darkMode ? "#60A5FA" : "var(--primary)"), textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-heading)" }}>
                Portal Tools
              </span>
              <button onClick={() => setFloatingPanelOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: highContrast ? "#fff" : (darkMode ? "#fff" : "#666"), fontSize: "1.1rem", lineHeight: 1, padding: "2px 6px", borderRadius: "6px" }}>✕</button>
            </div>

            {/* Contact Info */}
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: `1px solid ${highContrast ? "#555" : (darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)")}` }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.5, marginBottom: "0.6rem", color: highContrast ? "#fff" : "inherit" }}>Support</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: highContrast ? "#fff" : "var(--foreground)" }}>
                  <Phone size={13} style={{ color: highContrast ? "#FF6B6B" : (darkMode ? "#60A5FA" : "var(--primary)"), flexShrink: 0 }} />
                  <span>+233(0)30 290 5009</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: highContrast ? "#fff" : "var(--foreground)" }}>
                  <Phone size={13} style={{ color: highContrast ? "#FF6B6B" : (darkMode ? "#60A5FA" : "var(--primary)"), flexShrink: 0 }} />
                  <span>+233(0) 50 140 4994</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: highContrast ? "#fff" : "var(--foreground)" }}>
                  <Mail size={13} style={{ color: highContrast ? "#FF6B6B" : (darkMode ? "#60A5FA" : "var(--primary)"), flexShrink: 0 }} />
                  <span>info@htu.edu.gh</span>
                </div>
              </div>
            </div>

            {/* Accessibility Controls */}
            <div>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.5, marginBottom: "0.75rem", color: highContrast ? "#fff" : "inherit" }}>Accessibility</p>

              {/* Contrast */}
              <div style={{ marginBottom: "0.75rem" }}>
                <p style={{ fontSize: "0.75rem", marginBottom: "0.35rem", fontWeight: 600, color: highContrast ? "#fff" : "var(--foreground)", opacity: 0.7 }}>Contrast</p>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[{ label: "Standard", val: false }, { label: "High Contrast", val: true }].map(({ label, val }) => (
                    <button key={label} onClick={() => setHighContrast(val)} style={{
                      flex: 1, padding: "5px 8px", fontSize: "0.72rem", cursor: "pointer", fontWeight: 700, borderRadius: "8px",
                      border: `1.5px solid ${highContrast === val ? "var(--primary)" : "rgba(0,0,0,0.1)"}`,
                      background: highContrast === val ? (highContrast ? "#FF6B6B" : "var(--primary)") : "transparent",
                      color: highContrast === val ? (highContrast ? "#000" : "#fff") : (highContrast ? "#fff" : "var(--foreground)"),
                      transition: "all 0.15s ease"
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              {!highContrast && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <p style={{ fontSize: "0.75rem", marginBottom: "0.35rem", fontWeight: 600, color: "var(--foreground)", opacity: 0.7 }}>Theme</p>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[{ label: "Light", val: false }, { label: "Dark Mode", val: true }].map(({ label, val }) => (
                      <button key={label} onClick={() => setDarkMode(val)} style={{
                        flex: 1, padding: "5px 8px", fontSize: "0.72rem", cursor: "pointer", fontWeight: 700, borderRadius: "8px",
                        border: `1.5px solid ${darkMode === val ? "var(--primary)" : "rgba(0,0,0,0.1)"}`,
                        background: darkMode === val ? "var(--primary)" : "transparent",
                        color: darkMode === val ? "#fff" : "var(--foreground)",
                        transition: "all 0.15s ease"
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text size */}
              <div style={{ marginBottom: "0.75rem" }}>
                <p style={{ fontSize: "0.75rem", marginBottom: "0.35rem", fontWeight: 600, color: highContrast ? "#fff" : "var(--foreground)", opacity: 0.7 }}>Text Size</p>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[{ label: "A−", val: "small" }, { label: "A", val: "normal" }, { label: "A+", val: "large" }].map(({ label, val }) => (
                    <button key={val} onClick={() => setTextSize(val)} style={{
                      flex: 1, padding: "5px 4px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 800, borderRadius: "8px",
                      border: `1.5px solid ${textSize === val ? "var(--primary)" : "rgba(0,0,0,0.1)"}`,
                      background: textSize === val ? "var(--primary)" : "transparent",
                      color: textSize === val ? "#fff" : (highContrast ? "#fff" : "var(--foreground)"),
                      transition: "all 0.15s ease"
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Readable Font */}
              <button onClick={() => setReadableFont(!readableFont)} style={{
                width: "100%", padding: "7px", fontSize: "0.78rem", cursor: "pointer", fontWeight: 700, borderRadius: "8px",
                border: `1.5px solid ${readableFont ? "var(--primary)" : "rgba(0,0,0,0.1)"}`,
                background: readableFont ? "var(--primary)" : "transparent",
                color: readableFont ? "#fff" : (highContrast ? "#fff" : "var(--foreground)"),
                transition: "all 0.15s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
              }}>
                <Accessibility size={13} /> {readableFont ? "Readable Font: ON" : "Readable Font: OFF"}
              </button>
            </div>
          </div>
        )}

        {/* Floating trigger button */}
        <button
          onClick={() => setFloatingPanelOpen(!floatingPanelOpen)}
          title="Accessibility & Contact"
          className="landing-fab-btn"
          style={{
            background: highContrast ? "#FF6B6B" : "var(--primary)",
            color: highContrast ? "#000" : "#fff",
            transform: floatingPanelOpen ? "rotate(45deg) scale(1.08)" : "scale(1)"
          }}
        >
          <Accessibility size={22} />
        </button>
      </div>

      {/* Mobile nav overlay */}
      <div
        className={`mobile-nav-backdrop${mobileMenuOpen ? " open" : ""}`}
        onClick={closeMobileMenu}
        aria-hidden={!mobileMenuOpen}
      />

      <nav
        className={`mobile-nav-drawer${mobileMenuOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen}
        style={{ backgroundColor: highContrast ? "#000" : "var(--card-bg)" }}
      >
        <div className="mobile-nav-drawer-header">
          <div className="landing-brand">
            <h1 style={{ color: highContrast ? "#FFF" : "var(--primary)", fontFamily: "var(--font-heading)", fontSize: "1rem" }}>
              HTU Dues Portal
            </h1>
            <p style={{ color: highContrast ? "#FF6B6B" : "var(--secondary)" }}>Menu</p>
          </div>
          <button
            type="button"
            className="mobile-nav-close"
            aria-label="Close menu"
            onClick={closeMobileMenu}
          >
            <X size={22} />
          </button>
        </div>
        <div className="mobile-nav-drawer-links">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="mobile-nav-drawer-link"
              onClick={closeMobileMenu}
              style={{ color: highContrast ? "#FFF" : "var(--foreground)" }}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="mobile-nav-drawer-footer">
          <Link href="/auth/login" className="btn btn-primary mobile-nav-drawer-cta" onClick={closeMobileMenu}>
            <LogIn size={18} /> Sign in to pay dues
          </Link>
        </div>
      </nav>

      {/* Portal status banner */}
      <div
        className="landing-alert"
        style={{
          backgroundColor: highContrast ? "#222222" : "rgba(245, 158, 11, 0.08)",
          color: highContrast ? "#FF6B6B" : "var(--foreground)",
          borderBottom: `1px solid ${highContrast ? "#FFFFFF" : "rgba(245, 158, 11, 0.2)"}`,
        }}
      >
        <Calendar size={16} style={{ color: highContrast ? "#FF6B6B" : "var(--warning)", flexShrink: 0 }} />
        <span>
          <strong>2026/2027 dues window is open.</strong> Pay your department dues before course registration.
        </span>
      </div>

      {/* Header */}
      <header
        className="header landing-header"
        style={{
          borderBottom: `1px solid ${highContrast ? "#FFFFFF" : "var(--border)"}`,
          boxShadow: "var(--shadow-sm)",
          backgroundColor: highContrast ? "#000" : "var(--card-bg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
          <div className="htu-logo-container animate-fade-in-1" style={{ width: "52px", height: "52px" }}>
            <img src="/htu_logo.jpg" alt="HTU Crest Logo" className="htu-logo-img" />
          </div>
          <div className="landing-brand animate-fade-in-1">
            <h1 style={{ color: highContrast ? "#FFF" : "var(--primary)", fontFamily: "var(--font-heading)" }}>
              Ho Technical University
            </h1>
            <p style={{ color: highContrast ? "#FF6B6B" : "var(--secondary)" }}>
              Departmental Dues Portal
            </p>
          </div>
        </div>

        <nav className="landing-nav landing-nav-desktop" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="landing-nav-link"
              style={{ color: highContrast ? "#FFF" : "var(--foreground)" }}
            >
              {label}
            </a>
          ))}
          <Link href="/auth/login" className="btn btn-primary landing-nav-cta" style={{ padding: "0.5rem 1.1rem", fontSize: "0.85rem" }}>
            <LogIn size={16} /> Sign in
          </Link>
        </nav>

        <button
          type="button"
          className="landing-menu-toggle"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <main className="landing-main">

        {/* Hero */}
        <section
          className="landing-hero reveal-init"
          style={{
            backgroundImage: highContrast ? "none" : "url('/htu_campus_hero.jpg')",
            backgroundColor: highContrast ? "#000" : "var(--primary)",
            border: highContrast ? "2px solid #fff" : "none",
          }}
        >
          {!highContrast && <div className="landing-hero-overlay" />}

          <div className="landing-hero-content">
            <div className="landing-hero-badge animate-fade-in-1">
              <Award size={14} />
              <span>HTU Departmental Dues Portal</span>
            </div>

            {/* Memorable Heading Option 4 */}
            <h2 className="animate-fade-in-2" style={{ fontFamily: "var(--font-heading)", textShadow: highContrast ? "none" : "0 2px 8px rgba(0,0,0,0.35)", fontWeight: '700' }}>
              Pay once. Get cleared instantly.
            </h2>

            {/* Shortened lead paragraph */}
            <p className="landing-hero-lead animate-fade-in-3" style={{ fontSize: '16px', lineHeight: '28px', maxWidth: '600px' }}>
              Pay your department dues securely. Sign in using your HTU email, pay online, and download your receipt instantly.
            </p>

            <div className="landing-hero-actions animate-fade-in-4">
              <Link
                href="/auth/login"
                className="btn btn-accent"
                style={{
                  padding: "0.9rem 1.75rem",
                  fontSize: "1rem",
                  ...(highContrast ? { backgroundColor: "#FF6B6B", color: "#000" } : {}),
                }}
              >
                <LogIn size={18} /> Sign in to pay
              </Link>

              {/* Premium Glass Effect button */}
              <a
                href="#verify"
                className="btn"
                style={{
                  padding: "0.9rem 1.6rem",
                  fontSize: "1rem",
                  color: "#fff",
                  background: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <ShieldCheck size={18} /> Verify a receipt
              </a>
            </div>


          </div>

          {/* Scroll Indicator */}
          {!highContrast && (
            <div
              className="landing-hero-scroll animate-fade-in-4"
              onClick={() => {
                const el = document.getElementById("features");
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="scroll-text">Scroll to learn more</span>
              <ChevronDown className="scroll-arrow" size={14} />
            </div>
          )}
        </section>

        {/* Portal features */}
        <section id="features" className="features-section-alt reveal-init">
          <div className="features-inner">
            <div className="features-intro">
              <span className="section-badge">Portal Features</span>
              <h2>Everything you need to clear your dues</h2>
              <p>
                Pay, track, and verify departmental dues in one official HTU portal — built for students and registration staff.
              </p>
            </div>

            <div className="features-grid">
              {PORTAL_FEATURES.map(({ title, desc, icon: Icon, iconTone }) => (
                <div
                  key={title}
                  className={`feature-card${highContrast ? " feature-card-hc" : ""}`}
                >
                  <div className={`feature-icon-box feature-icon-${iconTone}`}>
                    <Icon size={20} />
                  </div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === Redesigned Benefits & Showcase Section === */}
        <section id="benefits" className="benefits-section-alt reveal-init">
          <div className="benefits-container">
            {/* Left: Showcase image with floating widgets */}
            <div className="student-showcase-container">
              <div className="student-showcase-stage">
                <img
                  src="/student_paying.png"
                  alt="HTU Student Paying Dues"
                  className="student-main-image"
                />

                {/* Widget 1: Student Status Card */}
                <div className="floating-metric-card floating-card-1" style={highContrast ? { border: "2px solid #ffffff", background: "#000" } : {}}>
                  <div className="metric-icon-wrapper" style={{ backgroundColor: highContrast ? "#222" : "rgba(0, 0, 140, 0.08)", color: highContrast ? "#fff" : "var(--primary)" }}>
                    <GraduationCap size={18} />
                  </div>
                  <div className="metric-text-box">
                    <span style={highContrast ? { color: "#fff", opacity: 0.8 } : {}}>Student Status</span>
                    <strong style={highContrast ? { color: "#fff" } : {}}>Level 400 • Cleared</strong>
                  </div>
                </div>

                {/* Widget 2: Real-time Status Card */}
                <div className="floating-metric-card floating-card-2" style={highContrast ? { border: "2px solid #ffffff", background: "#000" } : {}}>
                  <div className="metric-icon-wrapper" style={{ backgroundColor: highContrast ? "#222" : "rgba(16, 185, 129, 0.1)", color: highContrast ? "#fff" : "var(--success)" }}>
                    <Sparkles size={18} />
                  </div>
                  <div className="metric-text-box">
                    <span style={highContrast ? { color: "#fff", opacity: 0.8 } : {}}>Clearance Speed</span>
                    <strong style={highContrast ? { color: "#fff" } : {}}>Under 2 Mins</strong>
                  </div>
                </div>

                {/* Widget 3: Success Rate Card */}
                <div className="floating-metric-card floating-card-3" style={highContrast ? { border: "2px solid #ffffff", background: "#000" } : {}}>
                  <div className="metric-icon-wrapper" style={{ backgroundColor: highContrast ? "#222" : "rgba(245, 158, 11, 0.1)", color: highContrast ? "#fff" : "var(--warning)" }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div className="metric-text-box">
                    <span style={highContrast ? { color: "#fff", opacity: 0.8 } : {}}>Ledger Verification</span>
                    <strong style={highContrast ? { color: "#fff" } : {}}>99.8% Success Rate</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Benefits checklist list */}
            <div className="benefits-right-content">
              <span className="section-badge" style={highContrast ? { color: "#FF6B6B" } : {}}>How It Helps You</span>
              <h2 style={highContrast ? { color: "#fff" } : {}}>Say goodbye to long registration queues</h2>
              <p className="lead-text" style={highContrast ? { color: "#fff", opacity: 0.9 } : {}}>
                Designed to make student life easier, the Ho Technical University Departmental Dues Portal replaces manual bank drafts and paper trails with speed, accessibility, and absolute transparency.
              </p>

              <ul className="benefit-check-list">
                <li className="benefit-check-item">
                  <CheckCircle size={18} style={highContrast ? { color: "#fff" } : {}} />
                  <span style={highContrast ? { color: "#fff" } : {}}>Eliminate hours of waiting at physical bank counters</span>
                </li>
                <li className="benefit-check-item">
                  <CheckCircle size={18} style={highContrast ? { color: "#fff" } : {}} />
                  <span style={highContrast ? { color: "#fff" } : {}}>Instant receipt generation immediately after payment</span>
                </li>
                <li className="benefit-check-item">
                  <CheckCircle size={18} style={highContrast ? { color: "#fff" } : {}} />
                  <span style={highContrast ? { color: "#fff" } : {}}>Automatic clearance verification with HTU registry holds</span>
                </li>
                <li className="benefit-check-item">
                  <CheckCircle size={18} style={highContrast ? { color: "#fff" } : {}} />
                  <span style={highContrast ? { color: "#fff" } : {}}>Easy payment verification via staff mobile QR scan</span>
                </li>
                <li className="benefit-check-item">
                  <CheckCircle size={18} style={highContrast ? { color: "#fff" } : {}} />
                  <span style={highContrast ? { color: "#fff" } : {}}>Accessible visual themes (Standard & High Contrast)</span>
                </li>
                <li className="benefit-check-item">
                  <CheckCircle size={18} style={highContrast ? { color: "#fff" } : {}} />
                  <span style={highContrast ? { color: "#fff" } : {}}>Multi-network Mobile Money support (MTN, Telecel, AT)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="landing-process-section reveal-init">
          <div className="landing-section-header">
            <span className="landing-section-label" style={{ color: highContrast ? "#FF6B6B" : undefined }}>Simple process</span>
            <h3 className="landing-section-title">Clear your dues in 3 steps</h3>
          </div>

          <div className="landing-steps-grid">
            <div className="card landing-step-card landing-feature-card no-hover">
              <div className="landing-step-num" style={{ backgroundColor: highContrast ? "#222" : "rgba(0, 55, 114, 0.08)", color: "var(--primary)" }}>1</div>
              <h4 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "0.5rem", fontSize: "1rem" }}>Sign in</h4>
              <p style={{ fontSize: "0.85rem", opacity: 0.75, lineHeight: 1.6, margin: 0 }}>
                Use your @htu.edu.gh email. First time? Activate your account with a secure password.
              </p>
            </div>

            <div className="card landing-step-card landing-feature-card no-hover">
              <div className="landing-step-num" style={{ backgroundColor: highContrast ? "#222" : "rgba(227, 27, 35, 0.08)", color: "var(--accent-crimson)" }}>2</div>
              <h4 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "0.5rem", fontSize: "1rem" }}>Pay your dues</h4>
              <p style={{ fontSize: "0.85rem", opacity: 0.75, lineHeight: 1.6, margin: 0 }}>
                See your outstanding fees in the dashboard and pay through Paystack checkout.
              </p>
            </div>

            <div className="card landing-step-card landing-feature-card no-hover">
              <div className="landing-step-num" style={{ backgroundColor: highContrast ? "#222" : "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>3</div>
              <h4 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "0.5rem", fontSize: "1rem" }}>Get cleared</h4>
              <p style={{ fontSize: "0.85rem", opacity: 0.75, lineHeight: 1.6, margin: 0 }}>
                Download your digital receipt. Officers can verify it by receipt ID or QR scan.
              </p>
            </div>
          </div>
        </section>

        {/* Receipt verification */}
        <section
          id="verify"
          className="card landing-verify-section reveal-init"
          style={{ borderLeftColor: highContrast ? "#fff" : "var(--success)" }}
        >
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "center", marginBottom: "0.5rem" }}>
              <ShieldCheck size={24} style={{ color: "var(--success)" }} />
              <h3 className="landing-section-title" style={{ fontSize: "1.4rem" }}>Verify a receipt</h3>
            </div>
            <p style={{ opacity: 0.8, fontSize: "0.9rem", textAlign: "center", marginBottom: "1.75rem", lineHeight: 1.6 }}>
              Students and officers can confirm payment status by entering a receipt ID or Paystack reference below.
            </p>

            <form onSubmit={handleVerify} className="verify-form">
              <div className="verify-form-input-wrap">
                <Search className="verify-form-icon" size={18} />
                <input
                  type="text"
                  placeholder="Receipt ID or reference"
                  className="input verify-form-input"
                  value={receiptId}
                  onChange={(e) => setReceiptId(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary verify-form-submit" disabled={loading}>
                {loading ? "Checking..." : "Verify"}
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

        {/* Dues schedule */}
        <section id="tariffs" className="reveal-init landing-tariffs-section" style={{ scrollMarginTop: "90px" }}>
          <div className="landing-tariffs-header">
            <div>
              <span className="landing-section-label" style={{ color: highContrast ? "#FF6B6B" : undefined }}>Fee schedule</span>
              <h3 className="landing-section-title">Departmental dues</h3>
            </div>

            <div className="landing-tariffs-search">
              <Search size={16} className="landing-tariffs-search-icon" />
              <input
                type="text"
                placeholder="Search department..."
                className="input landing-tariffs-search-input"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile card list */}
          <div className="dues-mobile-list">
            {filteredDepts.length === 0 ? (
              <p className="dues-mobile-empty">No matching departments found.</p>
            ) : (
              filteredDepts.map((dept, idx) => (
                <article key={idx} className="dues-mobile-card">
                  <div className="dues-mobile-card-top">
                    <span className="dues-mobile-code">{dept.code}</span>
                    <span className="dues-mobile-fee">GHS {dept.fee.toFixed(2)}</span>
                  </div>
                  <h4 className="dues-mobile-name">{dept.name}</h4>
                  <p className="dues-mobile-faculty">{dept.faculty}</p>
                </article>
              ))
            )}
          </div>

          <div className="table-container dues-desktop-table">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Code</th>
                  <th>Department</th>
                  <th>Faculty</th>
                  <th style={{ textAlign: "right", width: "140px" }}>Amount (GHS)</th>
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

        {/* FAQ */}
        <section id="faq" className="landing-faq-section reveal-init">
          <div className="landing-section-header">
            <span className="landing-section-label" style={{ color: highContrast ? "#FF6B6B" : undefined }}>Common questions</span>
            <h3 className="landing-section-title">Need help?</h3>
          </div>

          <div className="landing-faq-list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="card landing-faq-item"
                role="button"
                tabIndex={0}
                aria-expanded={openFaq === i}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenFaq(openFaq === i ? null : i);
                  }
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



      {/* Footer */}
      <footer
        className="landing-footer"
        style={{
          backgroundColor: highContrast ? "#000" : "var(--primary)",
          borderTopColor: highContrast ? "#fff" : "var(--accent-crimson)",
        }}
      >
        <div className="landing-footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <div className="htu-logo-container" style={{ width: "30px", height: "30px" }}>
                <img src="/htu_logo.jpg" alt="HTU Crest Logo" className="htu-logo-img" />
              </div>
              <h4 style={{ fontFamily: "var(--font-heading)", color: highContrast ? "#FF6B6B" : "#fff", margin: 0, fontSize: "1.05rem" }}>
                Ho Technical University
              </h4>
            </div>
            <p style={{ fontSize: "0.8rem", opacity: 0.75, lineHeight: 1.6 }}>
              The premier career focused technical institution in Volta Region, Ghana. Empowering students with cutting edge academic education and practical skills training.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: "0.9rem", color: highContrast ? "#FF6B6B" : "rgba(255,255,255,0.92)", marginBottom: "1rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Portal links
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.85rem" }}>
              <Link href="/auth/login" style={{ opacity: 0.9 }}>Student sign in</Link>
              <Link href="/auth/register" style={{ opacity: 0.9 }}>First time activation</Link>
              <Link href="/auth/login?role=admin" style={{ opacity: 0.9 }}>Department admin</Link>
              <Link href="/auth/login?role=super" style={{ opacity: 0.9 }}>Super admin</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "0.9rem", color: highContrast ? "#FF6B6B" : "rgba(255,255,255,0.92)", marginBottom: "1rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Contact
            </h4>
            <p style={{ fontSize: "0.8rem", opacity: 0.75, lineHeight: 1.6, marginBottom: "0.5rem" }}>
              Box HP 217, Ho<br />
              VH-0044-6820<br />
              Volta Region, Ghana
            </p>
            <p style={{ fontSize: "0.8rem", opacity: 0.75, lineHeight: 1.6 }}>
              +233(0)30 290 5009<br />
              +233(0) 50 140 4994<br />
              Email: info@htu.edu.gh
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: "0.9rem", color: highContrast ? "#FF6B6B" : "rgba(255,255,255,0.92)", marginBottom: "1rem", fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Compliance
            </h4>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.78rem", opacity: 0.8, lineHeight: 1.5 }}>
              <Info size={16} style={{ color: highContrast ? "#FF6B6B" : "rgba(255,255,255,0.85)", flexShrink: 0, marginTop: "2px" }} />
              <p>
                Payments on this portal comply with the HTU Student Representative Council (SRC) financial statutes and Ho Technical University board guidelines.
              </p>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Ho Technical University. All Rights Reserved.</span>
          <span>Developed by HTU Information &amp; Communication Technology Directorate</span>
        </div>
      </footer>

    </div>
  );
}
