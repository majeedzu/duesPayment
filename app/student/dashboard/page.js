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
import { getClientSession, clearClientSession } from "@/lib/session";
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

  // Collapsible & responsive layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [isMobile, setIsMobile] = useState(false);
  
  // Tabs and pagination states
  const [activeTab, setActiveTab] = useState("payment"); // payment, history, notifications
  const [historyPage, setHistoryPage] = useState(1);
  const [notifFilter, setNotifFilter] = useState("all"); // all, unread, read
  const [notifUpdating, setNotifUpdating] = useState(false);

  // Monitor screen size for mobile responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const userSession = getClientSession();
    if (!userSession || userSession.role !== "student") {
      router.push("/auth/login");
      return;
    }
    setSession(userSession);
    fetchDashboardData();
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
  const handlePayDues = async () => {
    if (!dashboardData) return;
    setPaying(true);
    setPayError("");

    try {
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indexNumber: dashboardData.student.index_number,
          email: dashboardData.student.email,
          amount: dashboardData.department.dues_amount,
          departmentId: dashboardData.department.id
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
  const activePayment = payments.find(p => p.status === "success");
  const isPaid = !!activePayment;

  // Filter and paginated configurations
  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === "unread") return !n.is_read;
    if (notifFilter === "read") return n.is_read;
    return true;
  });

  const paymentsPerPage = 5;
  const totalHistoryPages = Math.ceil(payments.length / paymentsPerPage) || 1;
  const paginatedPayments = payments.slice(
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
            <img src="/htu_logo.jpg" alt="HTU Logo" style={{ width: "35px", height: "35px", borderRadius: "50%", border: "2px solid var(--accent-crimson)", objectFit: "cover", flexShrink: 0 }} />
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
              {notifications.some(n => !n.is_read) && (
                <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-crimson)" }} />
              )}
            </div>
            {(!sidebarCollapsed || isMobile) && <span>Notifications</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="sidebar-link" 
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
              <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>Welcome back, {student.full_name}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Clickable Header Notification Bell (switches view to notifications tab) */}
            <div 
              onClick={() => setActiveTab("notifications")} 
              style={{ position: "relative", cursor: "pointer", padding: "0.4rem", borderRadius: "50%", transition: "background-color 0.2s" }}
              title="View System Alerts"
            >
              <Bell size={20} />
              {notifications.some(n => !n.is_read) && (
                <span style={{ position: "absolute", top: "2px", right: "2px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-crimson)" }} />
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                backgroundColor: "var(--border)",
                overflow: "hidden",
                border: "2px solid var(--accent-crimson)",
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
          
          {/* TAB 1: Dues Payment */}
          {activeTab === "payment" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: "2rem" }}>
              
              {/* Left Column: Billing card & Department details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Payment Status Card */}
                <div className="card" style={{ 
                  borderLeft: isPaid ? "6px solid var(--success)" : "6px solid var(--danger)",
                  backgroundColor: isPaid ? "var(--success-bg)" : "var(--danger-bg)",
                  color: "var(--foreground)",
                  padding: "2rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, opacity: 0.7 }}>
                        Departmental Dues Status
                      </span>
                      <h2 style={{ fontSize: "2rem", marginTop: "0.25rem", color: "var(--primary)", fontFamily: "var(--font-heading)" }}>
                        {isPaid ? "Dues Fully Paid" : "Dues Outstanding"}
                      </h2>
                      <p style={{ marginTop: "0.5rem", opacity: 0.8, fontSize: "0.95rem" }}>
                        {isPaid 
                          ? `Clearance confirmed. Payment verified on ${new Date(activePayment.payment_date).toLocaleDateString()}.` 
                          : `Please complete payment of GHS ${parseFloat(department.dues_amount).toFixed(2)} to clear registration holds.`
                        }
                      </p>
                    </div>
                    <div>
                      {isPaid ? (
                        <CheckCircle2 size={56} style={{ color: "var(--success)" }} />
                      ) : (
                        <AlertTriangle size={56} style={{ color: "var(--danger)" }} />
                      )}
                    </div>
                  </div>

                  {payError && (
                    <div className="badge badge-danger" style={{ display: "block", marginTop: "1rem", textTransform: "none", padding: "0.5rem 1rem", width: "100%" }}>
                      {payError}
                    </div>
                  )}

                  {!isPaid && (
                    <button 
                      onClick={handlePayDues} 
                      className="btn btn-primary" 
                      style={{ marginTop: "1.5rem", padding: "0.85rem 2rem", fontSize: "1rem" }}
                      disabled={paying}
                    >
                      {paying ? (
                        <>
                          <Loader2 className="spinner" style={{ width: 18, height: 18 }} /> Connecting Paystack...
                        </>
                      ) : (
                        <>
                          <CreditCard size={18} /> Pay Dues (GHS {parseFloat(department.dues_amount).toFixed(2)})
                        </>
                      )}
                    </button>
                  )}

                  {isPaid && (
                    <button 
                      onClick={() => openReceiptModal(activePayment)} 
                      className="btn btn-secondary" 
                      style={{ marginTop: "1.5rem", padding: "0.85rem 2rem", display: "inline-flex", gap: "0.5rem" }}
                    >
                      <Download size={18} /> View Stamped Receipt
                    </button>
                  )}
                </div>

                {/* Department Details Card */}
                <div className="card">
                  <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Building2 size={20} /> Department Details
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1rem" }}>
                    <div>
                      <p style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Department</p>
                      <p style={{ fontWeight: 600, color: "var(--primary)" }}>{department.name}</p>
                    </div>
                    <div>
                      <p style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Faculty</p>
                      <p style={{ fontWeight: 600 }}>{department.faculty}</p>
                    </div>
                    <div>
                      <p style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Fixed Dues Rate</p>
                      <p style={{ fontWeight: 700 }}>GHS {parseFloat(department.dues_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ opacity: 0.6, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Billing Cycle</p>
                      <p style={{ fontWeight: 600 }}>Academic Year 2025/2026</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Profile details & upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2rem 1.5rem" }}>
                  <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                    <div style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      backgroundColor: "var(--background)",
                      overflow: "hidden",
                      border: "3px solid var(--primary)",
                      boxShadow: "var(--shadow)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <User size={48} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                    
                    <label htmlFor="avatar-file" style={{
                      position: "absolute",
                      bottom: "5px",
                      right: "5px",
                      width: "35px",
                      height: "35px",
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-crimson)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "var(--shadow)",
                      border: "2px solid var(--card-bg)"
                    }}>
                      {uploadingAvatar ? <Loader2 className="spinner" style={{ width: 14, height: 14, borderTopColor: "#FFFFFF" }} /> : <ImageIcon size={16} />}
                    </label>
                    
                    <input 
                      type="file" 
                      id="avatar-file" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      style={{ display: "none" }} 
                      disabled={uploadingAvatar} 
                    />
                  </div>
                  
                  <h3 style={{ fontFamily: "var(--font-heading)" }}>{student.full_name}</h3>
                  <p style={{ opacity: 0.7, fontSize: "0.85rem", margin: "0.25rem 0" }}>{student.email}</p>
                  
                  <div style={{ width: "100%", height: "1px", backgroundColor: "var(--border)", margin: "1rem 0" }} />

                  <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <FileText size={15} style={{ opacity: 0.5 }} />
                      <span>Index Number: <strong>{student.index_number}</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <GraduationCap size={15} style={{ opacity: 0.5 }} />
                      <span>{student.programme}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Calendar size={15} style={{ opacity: 0.5 }} />
                      <span>Level: <strong>{student.level}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Quick Alerts Side panel */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 className="card-title" style={{ fontSize: "1.05rem", margin: 0 }}>Recent Alerts</h3>
                    <button 
                      onClick={() => setActiveTab("notifications")} 
                      style={{ border: "none", background: "none", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                    >
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
                            {!notif.is_read && <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent-crimson)", display: "inline-block" }} />}
                            {notif.title}
                          </h4>
                          <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.15rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{notif.message}</p>
                        </div>
                      ))
                    )}
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
                          <th>Transaction Reference</th>
                          <th>Clearance Value</th>
                          <th>Timestamp</th>
                          <th>Clearance Status</th>
                          <th>Verification slip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPayments.map((payment, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 600 }}>{payment.paystack_reference}</td>
                            <td style={{ fontWeight: 800 }}>GHS {parseFloat(payment.amount).toFixed(2)}</td>
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

    </div>
  );
}
