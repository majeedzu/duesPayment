"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  LogOut, 
  Bell, 
  Upload, 
  RefreshCw, 
  FileText,
  X,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { getClientSession, setClientSession, clearClientSession } from "@/lib/session";

// Map faculty names to their logo files
const getFacultyLogo = (facultyName) => {
  if (!facultyName) return { src: "/htu_logo.jpg", label: null };
  const f = facultyName.toLowerCase();
  if (f.includes("applied sciences") || f.includes("fast")) return { src: "/fast_logo.png", label: null };
  if (f.includes("engineering") || f.includes("foe")) return { src: "/foe_logo.jpg", label: null };
  // Fallback: HTU logo + short faculty name label
  const shortName = facultyName
    .replace("Faculty of ", "")
    .replace("Faculty ", "");
  return { src: "/htu_logo.jpg", label: shortName };
};

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [department, setDepartment] = useState(null);
  const [deptError, setDeptError] = useState("");
  
  // UI states
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Forced password change states
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  const fetchLayoutData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (res.ok && data.success) {
        setDepartment(data.data.department);
        setNotifications(data.data.notifications || []);
      } else {
        // If super_admin hits this route without a department, redirect them
        if (res.status === 403 && data.redirectTo) {
          router.push(data.redirectTo);
          return;
        }
        setDeptError(data.message || "Access restricted. No department assigned.");
      }
    } catch (error) {
      console.error("Error fetching layout details:", error);
      setDeptError("Failed to fetch department status details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getClientSession();
    if (!session || (session.role !== "dept_admin" && session.role !== "super_admin")) {
      router.push("/auth/login?role=dept_admin");
      return;
    }
    // Super admins without a department should use their own dashboard
    if (session.role === "super_admin" && !session.department_id) {
      router.push("/super-admin/dashboard");
      return;
    }
    Promise.resolve().then(() => {
      setAdmin(session);
      if (session.mustChangePassword) {
        setForcePasswordChange(true);
      }
      fetchLayoutData();
    });
   
  }, [router]);

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
      setAdmin(updatedSession);

      setTimeout(() => {
        setForcePasswordChange(false);
      }, 1500);
    } catch (err) {
      setChangePasswordError(err.message || "Something went wrong.");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleLogout = () => {
    clearClientSession();
    router.push("/");
  };

  const triggerRefresh = () => {
    // Reload layout data
    fetchLayoutData();
    // Refresh the current route
    router.refresh();
  };

  if (deptError) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)", padding: "1.5rem" }}>
        <div className="card" style={{ maxWidth: "450px", width: "100%", textAlign: "center", padding: "3rem 2rem", borderTop: "4px solid var(--danger)", boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)" }}>
          <ShieldAlert size={60} style={{ color: "var(--danger)", margin: "0 auto 1.5rem" }} />
          <h2 style={{ color: "var(--danger)", fontFamily: "var(--font-heading)", fontSize: "1.5rem", marginBottom: "1rem" }}>Access Restricted</h2>
          <p style={{ fontSize: "0.95rem", opacity: 0.8, lineHeight: "1.6", marginBottom: "2rem" }}>
            {deptError}
          </p>
          <button onClick={handleLogout} className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", width: "100%", justifyContent: "center" }}>
            <LogOut size={16} /> Logout Account
          </button>
        </div>
      </div>
    );
  }

  if (loading && !admin) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 99 }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="htu-logo-container" style={{ width: "40px", height: "40px", flexShrink: 0 }}>
            <img
              src={getFacultyLogo(department?.faculty).src}
              alt="Faculty Logo"
              className="htu-logo-img"
            />
          </div>
          <div style={{ overflow: "hidden" }}>
            <h4 style={{ color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>HTU Dues</h4>
            {getFacultyLogo(department?.faculty).label ? (
              <span style={{ fontSize: "0.7rem", color: "var(--dashboard-accent)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                {getFacultyLogo(department?.faculty).label.toUpperCase()}
              </span>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "var(--dashboard-accent)", fontWeight: 600 }}>ADMIN PORTAL</span>
            )}
          </div>
        </div>

        <div className="sidebar-menu">
          <div style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", opacity: 0.6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Navigation
          </div>
          <Link href="/admin/dashboard" className={`sidebar-link ${pathname === "/admin/dashboard" ? "active" : ""}`}>
            <Users size={18} /> Dashboard
          </Link>
          <Link href="/admin/roster" className={`sidebar-link ${pathname === "/admin/roster" ? "active" : ""}`}>
            <FileText size={18} /> Student Roster
          </Link>
          <Link href="/admin/import" className={`sidebar-link ${pathname === "/admin/import" ? "active" : ""}`}>
            <Upload size={18} /> CSV Upload
          </Link>
          <Link href="/admin/transactions" className={`sidebar-link ${pathname === "/admin/transactions" ? "active" : ""}`}>
            <CreditCard size={18} /> Transactions
          </Link>

          {/* Department Name Banner — highly visible */}
          <div style={{
            margin: "1.25rem 0.75rem 0",
            padding: "1rem",
            borderRadius: "var(--radius)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 0 18px rgba(var(--dashboard-accent-rgb, 255,193,7), 0.15)"
          }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, marginBottom: "0.35rem", color: "white" }}>Current Department</p>
            <p style={{
              fontWeight: 800,
              fontSize: "0.95rem",
              lineHeight: 1.3,
              color: "var(--dashboard-accent)",
              textShadow: "0 0 12px rgba(255,193,7,0.4)",
              letterSpacing: "0.01em"
            }}>
              {department?.name || "Loading..."}
            </p>
            {department?.faculty && (
              <p style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.4rem", color: "white", lineHeight: 1.3 }}>
                {department.faculty}
              </p>
            )}
            <div style={{ marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.7rem", opacity: 0.55, color: "white" }}>Dues Amount</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--dashboard-accent)" }}>GHS {department?.dues_amount?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "35px", height: "35px", borderRadius: "50%", backgroundColor: "var(--dashboard-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
              {admin?.full_name?.charAt(0) || "A"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "white", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {admin?.full_name}
              </p>
              <p style={{ fontSize: "0.7rem", opacity: 0.6, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {admin?.email}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: "100%", padding: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-outline" 
              style={{ display: "none", padding: "0.5rem", cursor: "pointer" }}
              id="sidebar-toggle"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <style jsx global>{`
              @media (max-width: 900px) {
                #sidebar-toggle { display: block !important; }
              }
            `}</style>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "1.5rem", color: "var(--primary)", margin: 0 }}>
                  {pathname === "/admin/dashboard" && "Dashboard"}
                  {pathname === "/admin/roster" && "Student Roster"}
                  {pathname === "/admin/import" && "CSV Roster Upload"}
                  {pathname === "/admin/transactions" && "Transactions Monitor"}
                </h2>
                {department?.name && (
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.65rem",
                    borderRadius: "999px",
                    backgroundColor: "var(--primary)",
                    color: "white",
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap"
                  }}>
                    {department.name}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>
                {pathname === "/admin/dashboard" && `Overview · ${department?.faculty || ""}`}
                {pathname === "/admin/roster" && `All enrolled students · ${department?.name || "..."}`}
                {pathname === "/admin/import" && "Import students using `.csv` templates"}
                {pathname === "/admin/transactions" && "Live checkouts & cash verification log"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Notifications Toggle */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setShowNotifDrawer(!showNotifDrawer)} 
                className="btn btn-outline" 
                style={{ borderRadius: "50%", padding: "0.6rem", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Bell size={18} />
                {notifications.some(n => !n.is_read) && (
                  <span style={{ position: "absolute", top: "4px", right: "4px", width: "10px", height: "10px", backgroundColor: "var(--dashboard-accent)", borderRadius: "50%" }}></span>
                )}
              </button>

              {/* Simple Notification Dropdown */}
              {showNotifDrawer && (
                <div className="card" style={{ 
                  position: "absolute", 
                  top: "50px", 
                  right: "0", 
                  width: "320px", 
                  maxHeight: "400px", 
                  overflowY: "auto", 
                  zIndex: 200, 
                  boxShadow: "var(--shadow-lg)",
                  padding: "1rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                    <h4 style={{ fontSize: "0.95rem" }}>Notifications</h4>
                    <button onClick={() => setShowNotifDrawer(false)} style={{ border: "none", background: "none", cursor: "pointer", opacity: 0.6 }}><X size={16} /></button>
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", opacity: 0.6, textAlign: "center", padding: "1.5rem 0" }}>No new alerts</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {notifications.map((notif) => (
                        <div key={notif.id} style={{ fontSize: "0.8rem", padding: "0.5rem", borderRadius: "var(--radius-sm)", backgroundColor: notif.is_read ? "transparent" : "rgba(var(--primary-rgb), 0.04)" }}>
                          <p style={{ fontWeight: 600, color: "var(--primary)" }}>{notif.title}</p>
                          <p style={{ opacity: 0.8, marginTop: "0.25rem" }}>{notif.message}</p>
                          <span style={{ fontSize: "0.7rem", opacity: 0.5, display: "block", marginTop: "0.25rem" }}>{new Date(notif.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={triggerRefresh} 
              className="btn btn-outline" 
              style={{ borderRadius: "50%", padding: "0.6rem", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Refresh Portal"
            >
              <RefreshCw size={18} className={loading ? "spinner" : ""} />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="content-body">
          {children}
        </div>
      </main>

      {forcePasswordChange && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
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
              Welcome to the HTU Dues Payment Portal! To secure your account, please choose a new password for your administrative portal.
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
