"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CreditCard, ShieldCheck, CheckCircle2, AlertTriangle, 
  Download, Image as ImageIcon, Bell, LogOut, Loader2,
  Calendar, FileText, User, Mail, GraduationCap, Building2, Eye,
  ChevronLeft, ChevronRight, Menu, X, Check
} from "lucide-react";
import { getClientSession, setClientSession, clearClientSession } from "@/lib/session";
import QRCode from "qrcode";

export default function StudentDashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Payment initiation state
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  
  // Active receipt for modal display
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  
  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [verifyingRef, setVerifyingRef] = useState(null);

  // Collapsible & responsive layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [isMobile, setIsMobile] = useState(false);
  
  // Tabs and pagination states
  const [activeTab, setActiveTab] = useState("payment"); // payment, history, notifications
  const [historyPage, setHistoryPage] = useState(1);
  const [notifFilter, setNotifFilter] = useState("all"); // all, unread, read
  const [notifUpdating, setNotifUpdating] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

  // Forced password change states
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  // Monitor screen size for mobile responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/profile");
      const result = await res.json();
      if (res.ok) {
        setDashboardData(result.data);
      } else {
        console.error("Failed to load student data", result.message);
      }
    } catch (err) {
      console.error("Error loading dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("htu-dues-theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      document.documentElement.removeAttribute("data-theme");
    }

    const userSession = getClientSession();
    if (!userSession || userSession.role !== "student") {
      router.push("/auth/login");
      return;
    }
    Promise.resolve().then(() => {
      setSession(userSession);
      if (userSession.mustChangePassword) {
        setForcePasswordChange(true);
      }
      fetchDashboardData();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setChangePasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError("Passwords do not match.");
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError("");
    setChangePasswordSuccess("");

    try {
      const res = await fetch("/api/student/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update password.");
      }

      setChangePasswordSuccess("Password updated successfully!");
      
      // Update client session cookie to remove mustChangePassword flag
      const userSession = getClientSession();
      const updatedSession = { ...userSession, mustChangePassword: false };
      setClientSession(updatedSession);
      setSession(updatedSession);

      setTimeout(() => {
        setForcePasswordChange(false);
      }, 1500);
    } catch (err) {
      setChangePasswordError(err.message || "Something went wrong.");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await fetch("/api/student/profile");
      const result = await res.json();
      if (res.ok) {
        setDashboardData(prev => ({
          ...prev,
          notifications: result.data.notifications
        }));
      }
    } catch (err) {
      console.error("Error refreshing notifications:", err);
    }
  };

  const handleMarkRead = async (id) => {
    setNotifUpdating(true);
    try {
      const res = await fetch("/api/student/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await refreshNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    } finally {
      setNotifUpdating(false);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifUpdating(true);
    try {
      const res = await fetch("/api/student/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      if (res.ok) {
        await refreshNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    } finally {
      setNotifUpdating(false);
    }
  };

  const handleLogout = () => {
    clearClientSession();
    router.push("/");
  };

  const handleVerifyTransaction = async (ref) => {
    setVerifyingRef(ref);
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to verify transaction.");
      
      alert(result.message);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || "Error verifying transaction.");
    } finally {
      setVerifyingRef(null);
    }
  };

  // Profile Picture Upload Handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB.");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64data = reader.result;
      try {
        const res = await fetch("/api/student/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: base64data }),
        });
        const result = await res.json();
        if (res.ok) {
          // Update local state
          setDashboardData(prev => ({
            ...prev,
            profile: { ...prev.profile, avatar_url: result.avatarUrl }
          }));
        } else {
          alert(result.message || "Failed to upload image.");
        }
      } catch (err) {
        console.error("Avatar upload error:", err);
        alert("An error occurred during picture upload.");
      } finally {
        setUploadingAvatar(false);
      }
    };
  };

  // Initialize Payment Handler
  const handlePayDues = async (semester = 'Both Semesters') => {
    if (!dashboardData) return;
    setPaying(true);
    setPayError("");

    const baselineDues = parseFloat(dashboardData.department.dues_amount);
    const targetAmount = (semester === '1st Semester' || semester === '2nd Semester')
      ? baselineDues / 2
      : baselineDues;

    try {
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indexNumber: dashboardData.student.index_number,
          email: dashboardData.student.email,
          amount: targetAmount,
          departmentId: dashboardData.department.id,
          semester,
          academicYear: "2025/2026"
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to initialize payment.");
      }

      // Redirect to authorization URL (Paystack checkout or local simulator)
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setPayError(err.message || "Payment service error.");
      setPaying(false);
    }
  };

  // Generate QR Code & Open Receipt Modal
  const openReceiptModal = async (payment) => {
    setActiveReceipt(payment);
    try {
      const host = window.location.origin;
      const verificationUrl = `${host}/verify/${payment.receipt_id}`;
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        margin: 2,
        width: 150,
        color: {
          dark: "#00008C", // HTU Brand Navy Blue
          light: "#FFFFFF"
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (err) {
      console.error("Failed to generate receipt QR code:", err);
    }
  };

  const closeReceiptModal = () => {
    setActiveReceipt(null);
    setQrCodeUrl("");
  };

  const triggerPrint = () => {
    window.print();
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <Loader2 className="spinner" />
        <span style={{ fontWeight: 600 }}>Loading Portal...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <AlertTriangle size={48} style={{ color: "var(--danger)" }} />
        <h3>Data synchronization failed.</h3>
        <button onClick={handleLogout} className="btn btn-primary">Go to Login</button>
      </div>
    );
  }

  const { student, profile, department, payments, notifications } = dashboardData;
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const academicYear = "2025/2026";
  const successPayments = payments.filter(p => p.status === "success" && (p.academic_year === academicYear || !p.academic_year));

  const hasPaidFull = successPayments.some(p => p.semester === "Both Semesters" || !p.semester);
  const hasPaidFirst = successPayments.some(p => p.semester === "1st Semester");
  const hasPaidSecond = successPayments.some(p => p.semester === "2nd Semester");

  const isFirstSemPaid = hasPaidFull || hasPaidFirst;
  const isSecondSemPaid = hasPaidFull || hasPaidSecond;
  const isPaid = isFirstSemPaid && isSecondSemPaid;

  // For backward compatibility receipt views
  const activePayment = successPayments[0] || null;

  // Sorting logic for payments history ledger
  const sortedPayments = [...payments].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === "created_at" || sortConfig.key === "payment_date") {
      aVal = new Date(aVal || 0).getTime();
      bVal = new Date(bVal || 0).getTime();
    } else if (sortConfig.key === "amount") {
      aVal = parseFloat(aVal || 0);
      bVal = parseFloat(bVal || 0);
    } else {
      aVal = String(aVal || "").toLowerCase();
      bVal = String(bVal || "").toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Filter and paginated configurations
  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === "unread") return !n.is_read;
    if (notifFilter === "read") return n.is_read;
    return true;
  });

  const paymentsPerPage = 5;
  const totalHistoryPages = Math.ceil(sortedPayments.length / paymentsPerPage) || 1;
  const paginatedPayments = sortedPayments.slice(
    (historyPage - 1) * paymentsPerPage,
    historyPage * paymentsPerPage
  );

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay for Mobile drawer */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99 }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        style={{
          width: isMobile ? "var(--sidebar-width)" : (sidebarCollapsed ? "70px" : "var(--sidebar-width)"),
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden",
          ...isMobile && sidebarOpen ? { transform: "translateX(0)" } : {}
        }}
      >
        <div className="sidebar-brand" style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", justifyContent: sidebarCollapsed && !isMobile ? "center" : "flex-start" }}>
            <div className="htu-logo-container" style={{ width: "35px", height: "35px" }}>
              <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <div style={{ overflow: "hidden" }}>
                <h4 style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.9rem", whiteSpace: "nowrap" }}>Ho Tech Uni</h4>
                <span style={{ fontSize: "0.65rem", opacity: 0.7, display: "block" }}>Dues Portal</span>
              </div>
            )}
          </div>
          
          {/* Mobile sidebar close button */}
          {isMobile && (
            <button 
              onClick={() => setSidebarOpen(false)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", position: "absolute", right: "0px", top: "10px" }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-menu">
          <button 
            onClick={() => { setActiveTab("payment"); setSidebarOpen(false); }} 
            className={`sidebar-link ${activeTab === "payment" ? "active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer", display: "flex", gap: "0.75rem", alignItems: "center" }}
            title="Dues Payment"
          >
            <CreditCard size={18} />
            {(!sidebarCollapsed || isMobile) && <span>Dues Payment</span>}
          </button>
          
          <button 
            onClick={() => { setActiveTab("history"); setSidebarOpen(false); }} 
            className={`sidebar-link ${activeTab === "history" ? "active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer", display: "flex", gap: "0.75rem", alignItems: "center" }}
            title="Payment History"
          >
            <FileText size={18} />
            {(!sidebarCollapsed || isMobile) && <span>Payment History</span>}
          </button>

          <button 
            onClick={() => { setActiveTab("notifications"); setSidebarOpen(false); }} 
            className={`sidebar-link ${activeTab === "notifications" ? "active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer", display: "flex", gap: "0.75rem", alignItems: "center" }}
            title="Notifications"
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-8px",
                  backgroundColor: "var(--dashboard-accent)",
                  color: "#FFFFFF",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: 800,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  lineHeight: 1
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {(!sidebarCollapsed || isMobile) && <span>Notifications</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="sidebar-link sidebar-link-danger" 
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", gap: "0.75rem", alignItems: "center" }}
            title="Sign Out"
          >
            <LogOut size={18} />
            {(!sidebarCollapsed || isMobile) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className="main-content"
        style={{
          marginLeft: isMobile ? "0px" : (sidebarCollapsed ? "70px" : "var(--sidebar-width)"),
          transition: "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        {/* Header */}
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Mobile hamburger menu toggle */}
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="btn btn-outline" 
                style={{ padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Open sidebar navigation menu"
              >
                <Menu size={18} />
              </button>
            )}

            {/* Desktop collapse toggle */}
            {!isMobile && (
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="btn btn-outline" 
                style={{ padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label={sidebarCollapsed ? "Expand sidebar navigation menu" : "Collapse sidebar navigation menu"}
              >
                {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            )}

            <div>
              <h3 style={{ color: "var(--primary)" }}>
                {activeTab === "payment" && "Dues Payment Panel"}
                {activeTab === "history" && "Payment Ledger"}
                {activeTab === "notifications" && "Notification Control"}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
                {!isMobile && (
                  <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Welcome back, {student.full_name.split(' ')[0]}</span>
                )}
                <span style={{ 
                  width: "6px", 
                  height: "6px", 
                  borderRadius: "50%", 
                  backgroundColor: isPaid ? "var(--success)" : "var(--danger)",
                  display: "inline-block"
                }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isPaid ? "var(--success)" : "var(--danger)" }}>
                  {isPaid ? "Dues Verified" : "Dues Outstanding"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Clickable Header Notification Bell (switches view to notifications tab) */}
            <div 
              onClick={() => setActiveTab("notifications")} 
              style={{ position: "relative", cursor: "pointer", padding: "0.4rem", borderRadius: "50%", transition: "background-color 0.2s" }}
              title="View System Alerts"
              role="button"
              aria-label="View system alerts and notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  backgroundColor: "var(--dashboard-accent)",
                  color: "#FFFFFF",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: 800,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  lineHeight: 1
                }}>
                  {unreadCount}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                backgroundColor: "var(--border)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <User size={18} style={{ opacity: 0.5 }} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Body Content */}
        <div className="content-body">
          {activeTab === "payment" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>

              {/* Welcome Banner Card */}
              <div className="welcome-banner-card">
                <div className="welcome-banner-avatar" style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "2px solid #FFFFFF",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                  zIndex: 2,
                  flexShrink: 0
                }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <User size={30} style={{ color: "#FFFFFF", opacity: 0.9 }} />
                  )}
                </div>

                <div style={{ position: "relative", zIndex: 2, flexGrow: 1 }}>
                  <span style={{ fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.8, letterSpacing: "0.08em", display: "block" }}>Welcome Back,</span>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0.2rem 0", color: "#FFFFFF", fontFamily: "var(--font-heading)" }}>
                    {student.full_name.toUpperCase()}!
                  </h2>
                </div>
                <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", zIndex: 1 }} />
                <div style={{ position: "absolute", bottom: "-30px", right: "20px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", zIndex: 1 }} />
              </div>

              <div className="dashboard-two-col-grid">

                {/* LEFT COLUMN: Status + Alerts */}
                <div className="dashboard-main-col" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                {/* Dues Status Card */}
                <div className="card" style={{
                  borderLeft: isPaid ? "6px solid var(--success)" : (isFirstSemPaid || isSecondSemPaid) ? "6px solid #F59E0B" : "6px solid var(--danger)",
                  background: isPaid 
                    ? "linear-gradient(135deg, rgba(5, 150, 105, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)" 
                    : (isFirstSemPaid || isSecondSemPaid)
                    ? "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.03) 100%)"
                    : "var(--danger-bg)",
                  padding: "1.5rem",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box"
                }}>
                  <div className="dashboard-status-card-inner" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.7 }}>Departmental Dues Status</span>
                      <h2 style={{ 
                        fontSize: "clamp(1.4rem, 4vw, 2rem)", 
                        marginTop: "0.25rem", 
                        color: "var(--primary)", 
                        fontFamily: "var(--font-heading)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flexWrap: "wrap"
                      }}>
                        {isPaid ? "Dues Fully Paid" : (isFirstSemPaid || isSecondSemPaid) ? "Partially Paid" : "Dues Outstanding"}
                        {isPaid ? (
                          <span className="success-pulse-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                            <CheckCircle2 size={28} style={{ color: "var(--success)" }} />
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center" }}>
                            <AlertTriangle size={28} style={{ color: (isFirstSemPaid || isSecondSemPaid) ? "#F59E0B" : "var(--danger)" }} />
                          </span>
                        )}
                      </h2>
                    </div>

                    {/* Semester-by-semester breakdown layout */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", backgroundColor: "rgba(255, 255, 255, 0.5)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.6, textTransform: "uppercase", display: "block" }}>1st Semester</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
                          {isFirstSemPaid ? (
                            <>
                              <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                              <span style={{ fontWeight: 700, color: "var(--success)", fontSize: "0.9rem" }}>Paid</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={16} style={{ color: "var(--danger)" }} />
                              <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: "0.9rem" }}>Outstanding (GHS {(parseFloat(department.dues_amount) / 2).toFixed(2)})</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.6, textTransform: "uppercase", display: "block" }}>2nd Semester</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
                          {isSecondSemPaid ? (
                            <>
                              <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                              <span style={{ fontWeight: 700, color: "var(--success)", fontSize: "0.9rem" }}>Paid</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={16} style={{ color: "var(--danger)" }} />
                              <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: "0.9rem" }}>Outstanding (GHS {(parseFloat(department.dues_amount) / 2).toFixed(2)})</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {payError && (
                    <div className="badge badge-danger" style={{ display: "block", marginTop: "1rem", textTransform: "none", padding: "0.5rem 1rem", width: "100%" }}>
                      {payError}
                    </div>
                  )}

                  {/* Actions (Pay buttons or receipt triggers) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
                    {!isPaid && (
                      <>
                        {!isFirstSemPaid && !isSecondSemPaid && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button onClick={() => handlePayDues('1st Semester')} className="btn btn-outline" style={{ flex: 1, padding: "0.75rem", fontSize: "0.85rem", fontWeight: 700 }} disabled={paying}>
                                Pay 1st Sem (GHS {(parseFloat(department.dues_amount) / 2).toFixed(2)})
                              </button>
                              <button onClick={() => handlePayDues('2nd Semester')} className="btn btn-outline" style={{ flex: 1, padding: "0.75rem", fontSize: "0.85rem", fontWeight: 700 }} disabled={paying}>
                                Pay 2nd Sem (GHS {(parseFloat(department.dues_amount) / 2).toFixed(2)})
                              </button>
                            </div>
                            <button onClick={() => handlePayDues('Both Semesters')} className="btn btn-primary" style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem" }} disabled={paying}>
                              {paying ? <><Loader2 className="spinner" style={{ width: 18, height: 18 }} /> Connecting Paystack...</> : <><CreditCard size={18} /> Pay Both Semesters (GHS {parseFloat(department.dues_amount).toFixed(2)})</>}
                            </button>
                          </div>
                        )}
                        {isFirstSemPaid && !isSecondSemPaid && (
                          <button onClick={() => handlePayDues('2nd Semester')} className="btn btn-primary" style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem" }} disabled={paying}>
                            {paying ? <><Loader2 className="spinner" style={{ width: 18, height: 18 }} /> Connecting Paystack...</> : <><CreditCard size={18} /> Pay 2nd Semester (GHS {(parseFloat(department.dues_amount) / 2).toFixed(2)})</>}
                          </button>
                        )}
                        {!isFirstSemPaid && isSecondSemPaid && (
                          <button onClick={() => handlePayDues('1st Semester')} className="btn btn-primary" style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem" }} disabled={paying}>
                            {paying ? <><Loader2 className="spinner" style={{ width: 18, height: 18 }} /> Connecting Paystack...</> : <><CreditCard size={18} /> Pay 1st Semester (GHS {(parseFloat(department.dues_amount) / 2).toFixed(2)})</>}
                          </button>
                        )}
                      </>
                    )}

                    {isPaid && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {hasPaidFull ? (
                          <button onClick={() => openReceiptModal(successPayments.find(p => p.semester === 'Both Semesters' || !p.semester))} className="btn btn-receipt-highlight" style={{ width: "100%", padding: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                            <Download size={18} /> View Stamped Receipt
                          </button>
                        ) : (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            {successPayments.find(p => p.semester === '1st Semester') && (
                              <button onClick={() => openReceiptModal(successPayments.find(p => p.semester === '1st Semester'))} className="btn btn-receipt-highlight" style={{ flex: 1, padding: "0.75rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                                <Download size={14} /> 1st Sem Receipt
                              </button>
                            )}
                            {successPayments.find(p => p.semester === '2nd Semester') && (
                              <button onClick={() => openReceiptModal(successPayments.find(p => p.semester === '2nd Semester'))} className="btn btn-receipt-highlight" style={{ flex: 1, padding: "0.75rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                                <Download size={14} /> 2nd Sem Receipt
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Alerts */}
                <div className="card recent-alerts-card" style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 className="card-title" style={{ fontSize: "1.05rem", margin: 0 }}>Recent Alerts</h3>
                    <button onClick={() => setActiveTab("notifications")} style={{ border: "none", background: "none", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                      View All
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {notifications.length === 0 ? (
                      <p style={{ opacity: 0.5, fontSize: "0.8rem", textAlign: "center", padding: "1rem 0" }}>No recent alerts.</p>
                    ) : (
                      notifications.slice(0, 3).map((notif, index) => (
                        <div key={index} style={{ borderBottom: index !== Math.min(notifications.length, 3) - 1 ? "1px solid var(--border)" : "none", paddingBottom: "0.5rem" }}>
                          <h4 style={{ fontSize: "0.8rem", color: notif.is_read ? "var(--foreground)" : "var(--primary)", fontWeight: notif.is_read ? 600 : 700, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            {!notif.is_read && <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--dashboard-accent)", display: "inline-block" }} />}
                            {notif.title}
                          </h4>
                          <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Student Identity Card */}
              <div className="dashboard-side-col" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 1.5rem", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>

                  {/* Avatar */}
                  <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                    <div style={{ width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "var(--background)", overflow: "hidden", border: "3px solid var(--primary)", boxShadow: "var(--shadow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <User size={48} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                    <label htmlFor="avatar-file" style={{ position: "absolute", bottom: "5px", right: "5px", width: "35px", height: "35px", borderRadius: "50%", backgroundColor: "var(--dashboard-accent)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "var(--shadow)", border: "2px solid var(--card-bg)" }}>
                      {uploadingAvatar ? <Loader2 className="spinner" style={{ width: 14, height: 14 }} /> : <ImageIcon size={16} />}
                    </label>
                    <input type="file" id="avatar-file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} disabled={uploadingAvatar} />
                  </div>

                  {/* Name & Programme */}
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--primary)", textAlign: "center", textTransform: "uppercase", fontFamily: "var(--font-heading)", margin: "0.25rem 0", letterSpacing: "0.02em", width: "100%", wordBreak: "break-word" }}>
                    {student.full_name}
                  </h2>
                  <p style={{ opacity: 0.7, fontSize: "0.85rem", textAlign: "center", fontWeight: 600, width: "100%", wordBreak: "break-word" }}>
                    {student.programme} &middot; Level {student.level}
                  </p>

                  <div style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "1.25rem 0" }} />

                  {/* Biodata */}
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", minWidth: 0 }}>
                      <Mail size={16} style={{ opacity: 0.6, color: "var(--primary)", flexShrink: 0 }} />
                      <span style={{ wordBreak: "break-all", minWidth: 0, flex: 1 }}>{student.email}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", minWidth: 0 }}>
                      <FileText size={16} style={{ opacity: 0.6, color: "var(--primary)", flexShrink: 0 }} />
                      <span style={{ minWidth: 0, flex: 1 }}>Index: <strong>{student.index_number}</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", minWidth: 0 }}>
                      <Building2 size={16} style={{ opacity: 0.6, color: "var(--primary)", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.85rem", wordBreak: "break-word", minWidth: 0, flex: 1 }}>{student.faculty}</span>
                    </div>
                  </div>

                  <div style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "1.25rem 0" }} />

                  {/* Billing Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", width: "100%" }}>
                    <div style={{ backgroundColor: "rgba(0,0,140,0.03)", padding: "0.75rem", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                      <span style={{ fontSize: "0.6rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.5, display: "block", marginBottom: "0.25rem" }}>Academic Year</span>
                      <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>2025/2026</span>
                    </div>
                    <div style={{ backgroundColor: "rgba(0,0,140,0.03)", padding: "0.75rem", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                      <span style={{ fontSize: "0.6rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.5, display: "block", marginBottom: "0.25rem" }}>Dues Amount</span>
                      <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>GHS {parseFloat(department.dues_amount).toFixed(2)}</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

          {/* TAB 2: Payment History Ledger (with pagination to handle large lists) */}
          {activeTab === "history" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>Dues Transaction Ledger</h3>
                  <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>A formal historical record of all your dues payment sessions, including successful clearances and pending attempts.</p>
                </div>
                <div style={{ backgroundColor: "rgba(0, 0, 140, 0.05)", padding: "0.5rem 1rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>Total Cleared Value</span>
                  <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary)" }}>
                    GHS {payments.filter(p => p.status === "success").reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {payments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 0", opacity: 0.5 }}>
                  <FileText size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                  <p>No historical transactions recorded for this account.</p>
                </div>
              ) : (
                <>
                  <div className="table-container" style={{ marginBottom: "1.5rem" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th onClick={() => requestSort("paystack_reference")} style={{ cursor: "pointer", userSelect: "none" }}>
                            Transaction Reference {getSortIcon("paystack_reference")}
                          </th>
                          <th onClick={() => requestSort("amount")} style={{ cursor: "pointer", userSelect: "none" }}>
                            Clearance Value {getSortIcon("amount")}
                          </th>
                          <th onClick={() => requestSort("semester")} style={{ cursor: "pointer", userSelect: "none" }}>
                            Semester {getSortIcon("semester")}
                          </th>
                          <th onClick={() => requestSort("created_at")} style={{ cursor: "pointer", userSelect: "none" }}>
                            Timestamp {getSortIcon("created_at")}
                          </th>
                          <th onClick={() => requestSort("status")} style={{ cursor: "pointer", userSelect: "none" }}>
                            Clearance Status {getSortIcon("status")}
                          </th>
                          <th>Verification slip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPayments.map((payment, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600 }}>{payment.paystack_reference}</td>
                            <td style={{ fontWeight: 800 }}>GHS {parseFloat(payment.amount).toFixed(2)}</td>
                            <td style={{ fontSize: "0.85rem", fontWeight: 600 }}>{payment.semester || "Both Semesters"}</td>
                            <td style={{ fontSize: "0.85rem" }}>{new Date(payment.created_at).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${
                                payment.status === "success" 
                                  ? "badge-success" 
                                  : payment.status === "failed" 
                                  ? "badge-danger" 
                                  : "badge-warning"
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td>
                              {payment.status === "success" ? (
                                <button 
                                  onClick={() => openReceiptModal(payment)} 
                                  className="btn btn-outline" 
                                  style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem", display: "inline-flex", gap: "0.35rem", alignItems: "center" }}
                                >
                                  <Eye size={13} /> View Receipt
                                </button>
                              ) : payment.status === "pending" ? (
                                <button 
                                  onClick={() => handleVerifyTransaction(payment.paystack_reference)} 
                                  className="btn btn-outline" 
                                  style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem", display: "inline-flex", gap: "0.35rem", alignItems: "center", borderColor: "rgba(245, 158, 11, 0.4)", color: "#F59E0B" }}
                                  disabled={verifyingRef === payment.paystack_reference}
                                >
                                  {verifyingRef === payment.paystack_reference ? "Verifying..." : "Verify Status"}
                                </button>
                              ) : (
                                <span style={{ opacity: 0.5, fontSize: "0.8rem" }}>Not Available</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalHistoryPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                      <button 
                        onClick={() => setHistoryPage(p => Math.max(p - 1, 1))} 
                        disabled={historyPage === 1}
                        className="btn btn-outline"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                      >
                        &larr; Previous Page
                      </button>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        Page {historyPage} of {totalHistoryPages}
                      </span>
                      <button 
                        onClick={() => setHistoryPage(p => Math.min(p + 1, totalHistoryPages))} 
                        disabled={historyPage === totalHistoryPages}
                        className="btn btn-outline"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                      >
                        Next Page &rarr;
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: Notifications Center */}
          {activeTab === "notifications" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>System Notifications</h3>
                  <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>Review official department messages, transaction clearances, and registration alerts.</p>
                </div>
                
                {notifications.some(n => !n.is_read) && (
                  <button 
                    onClick={handleMarkAllRead} 
                    className="btn btn-outline" 
                    style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", display: "inline-flex", gap: "0.35rem", alignItems: "center" }}
                    disabled={notifUpdating}
                  >
                    <Check size={14} /> Mark All as Read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <button 
                  onClick={() => setNotifFilter("all")} 
                  className={`btn ${notifFilter === "all" ? "btn-primary" : "btn-outline"}`}
                  style={{ padding: "0.4rem 1.25rem", fontSize: "0.8rem" }}
                >
                  All Alerts ({notifications.length})
                </button>
                <button 
                  onClick={() => setNotifFilter("unread")} 
                  className={`btn ${notifFilter === "unread" ? "btn-primary" : "btn-outline"}`}
                  style={{ padding: "0.4rem 1.25rem", fontSize: "0.8rem" }}
                >
                  Unread ({notifications.filter(n => !n.is_read).length})
                </button>
                <button 
                  onClick={() => setNotifFilter("read")} 
                  className={`btn ${notifFilter === "read" ? "btn-primary" : "btn-outline"}`}
                  style={{ padding: "0.4rem 1.25rem", fontSize: "0.8rem" }}
                >
                  Read ({notifications.filter(n => n.is_read).length})
                </button>
              </div>

              {filteredNotifications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 0", opacity: 0.5 }}>
                  <Bell size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                  <p>No notifications matching this filter.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {filteredNotifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      style={{ 
                        border: "1px solid var(--border)", 
                        borderRadius: "var(--radius)", 
                        padding: "1.25rem",
                        backgroundColor: notif.is_read ? "transparent" : "rgba(0, 0, 140, 0.02)",
                        borderLeft: notif.is_read ? "1px solid var(--border)" : "4px solid var(--primary)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1.5rem"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {!notif.is_read && <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-crimson)" }} />}
                          <h4 style={{ fontSize: "0.95rem", color: notif.is_read ? "var(--foreground)" : "var(--primary)", fontWeight: notif.is_read ? 600 : 700 }}>
                            {notif.title}
                          </h4>
                        </div>
                        <p style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "0.35rem", lineHeight: 1.5 }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: "0.75rem", opacity: 0.45, display: "block", marginTop: "0.5rem" }}>
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {!notif.is_read && (
                        <button 
                          onClick={() => handleMarkRead(notif.id)} 
                          className="btn btn-outline" 
                          style={{ padding: "0.3rem 0.8rem", fontSize: "0.75rem", flexShrink: 0 }}
                          disabled={notifUpdating}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Digital Receipt Modal (Printable) */}
      {activeReceipt && (
        <div className="modal-overlay" onClick={closeReceiptModal}>
          <div 
            className="modal" 
            style={{ 
              maxWidth: "550px", 
              padding: "0", 
              overflow: "hidden", 
              backgroundColor: "#FFFFFF",
              color: "#0F172A" // Force white background and dark text for receipt print layout
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", backgroundColor: "var(--primary)", color: "white" }} className="no-print">
              <h3 style={{ fontSize: "1.1rem" }}>Digital Payment Receipt</h3>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={triggerPrint} className="btn btn-accent" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}>
                  Print / Save PDF
                </button>
                <button onClick={closeReceiptModal} className="btn btn-danger" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}>
                  Close
                </button>
              </div>
            </div>

            {/* Printable Receipt Slip */}
            <div id="printable-receipt" style={{ padding: "2.5rem 2rem", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "2px solid #00008C", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ color: "#00008C", fontSize: "1.4rem", fontWeight: 800 }}>HO TECHNICAL UNIVERSITY</h2>
                  <p style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748B", fontWeight: 700 }}>
                    Official Dues Receipt
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ 
                    border: "2px solid #10B981", 
                    color: "#10B981", 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: "4px",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    display: "inline-block"
                  }}>
                    PAID
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.5rem" }}>
                
                {/* Student Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.9rem" }}>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, display: "block" }}>STUDENT FULL NAME</span>
                    <strong style={{ color: "#0F172A" }}>{student.full_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, display: "block" }}>INDEX NUMBER</span>
                    <strong>{student.index_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, display: "block" }}>PROGRAMME / LEVEL</span>
                    <strong>{student.programme} (Level {student.level})</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "0.75rem", fontWeight: 600, display: "block" }}>DEPARTMENT</span>
                    <strong>{department.name}</strong>
                  </div>
                </div>

                {/* QR Code */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #E2E8F0", paddingLeft: "1rem" }}>
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Receipt Verification QR" style={{ width: "120px", height: "120px" }} />
                  ) : (
                    <div style={{ width: "120px", height: "120px", backgroundColor: "#F1F5F9" }} />
                  )}
                  <span style={{ fontSize: "0.6rem", color: "#64748B", marginTop: "0.5rem", textAlign: "center" }}>Scan to Authenticate</span>
                </div>

              </div>

              <div style={{ height: "1px", backgroundColor: "#E2E8F0", margin: "1.5rem 0" }} />

              {/* Financial Details */}
              <div style={{ backgroundColor: "#F8FAFC", padding: "1rem 1.25rem", borderRadius: "8px", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Dues Description:</span>
                  <span style={{ fontWeight: 600 }}>{department.name} Departmental Dues</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Transaction Reference:</span>
                  <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{activeReceipt.paystack_reference}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Payment Channel:</span>
                  <span style={{ fontWeight: 600 }}>Paystack (GHS Card/Momo)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                  <strong style={{ color: "#00008C" }}>Amount Charged:</strong>
                  <strong style={{ color: "#00008C", fontSize: "1.1rem" }}>GHS {parseFloat(activeReceipt.amount).toFixed(2)}</strong>
                </div>
              </div>

              <div style={{ marginTop: "2rem", borderTop: "1px dashed #CBD5E1", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748B" }}>
                  <div>
                    <span>Receipt Verification ID:</span>
                    <strong style={{ display: "block", color: "#0F172A", marginTop: "0.1rem" }}>{activeReceipt.receipt_id}</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span>Payment Date:</span>
                    <strong style={{ display: "block", color: "#0F172A", marginTop: "0.1rem" }}>
                      {new Date(activeReceipt.payment_date).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Print stylesheet */}
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #printable-receipt, #printable-receipt * {
                  visibility: visible;
                }
                #printable-receipt {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  border: none !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

          </div>
        </div>
      )}

      {/* Forced Password Change Modal */}
      {forcePasswordChange && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            width: "100%",
            maxWidth: "480px",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            padding: "2.5rem 2rem",
            textAlign: "center",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            animation: "fadeIn 0.3s ease-out"
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 140, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem"
            }}>
              <ShieldCheck style={{ color: "#00008C" }} size={32} />
            </div>

            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: "0.5rem"
            }}>
              Set Your Secure Password
            </h2>
            <p style={{
              fontSize: "0.9rem",
              color: "#64748B",
              marginBottom: "2rem",
              lineHeight: "1.5"
            }}>
              Welcome to the HTU Dues Payment Portal! To secure your account, please choose a new password for your student portal.
            </p>

            <form onSubmit={handlePasswordChangeSubmit} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    height: "48px",
                    padding: "0 1rem",
                    borderRadius: "12px",
                    backgroundColor: "#EEF3FF",
                    border: "none",
                    fontSize: "0.95rem",
                    color: "#0F172A",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-type your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    height: "48px",
                    padding: "0 1rem",
                    borderRadius: "12px",
                    backgroundColor: "#EEF3FF",
                    border: "none",
                    fontSize: "0.95rem",
                    color: "#0F172A",
                    outline: "none"
                  }}
                />
              </div>

              {changePasswordError && (
                <div style={{
                  color: "#EF4444",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <AlertTriangle size={16} />
                  <span>{changePasswordError}</span>
                </div>
              )}

              {changePasswordSuccess && (
                <div style={{
                  color: "#059669",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  backgroundColor: "rgba(5, 150, 105, 0.1)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <CheckCircle2 size={16} />
                  <span>{changePasswordSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={changePasswordLoading}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "#00008C",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s",
                  marginTop: "0.5rem"
                }}
                onMouseOver={(e) => { if (!changePasswordLoading) e.currentTarget.style.background = '#00005E'; }}
                onMouseOut={(e) => { if (!changePasswordLoading) e.currentTarget.style.background = '#00008C'; }}
              >
                {changePasswordLoading ? (
                  <Loader2 className="spin-icon" style={{ animation: "spin 1s linear infinite" }} size={18} />
                ) : (
                  "Update & Continue"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
