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
  X
} from "lucide-react";
import { getClientSession, clearClientSession } from "@/lib/session";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [department, setDepartment] = useState(null);
  
  // UI states
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const session = getClientSession();
    if (!session) {
      router.push("/auth/login?role=dept_admin");
      return;
    }
    if (session.role !== "dept_admin" && session.role !== "super_admin") {
      router.push("/auth/login?role=dept_admin");
      return;
    }
    setAdmin(session);
    fetchLayoutData();
  }, [router]);

  const fetchLayoutData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDepartment(data.data.department);
          setNotifications(data.data.notifications || []);
        }
      }
    } catch (error) {
      console.error("Error fetching layout details:", error);
    } finally {
      setLoading(false);
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
          <div className="htu-logo-container" style={{ width: "40px", height: "40px" }}>
            <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
          </div>
          <div>
            <h4 style={{ color: "white" }}>HTU Dues</h4>
            <span style={{ fontSize: "0.75rem", color: "var(--dashboard-accent)", fontWeight: 600 }}>ADMIN PORTAL</span>
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

          <div style={{ marginTop: "1rem", padding: "0.5rem 1rem", fontSize: "0.75rem", opacity: 0.6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Department
          </div>
          <div style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", opacity: 0.9, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "var(--radius)" }}>
            <p style={{ fontWeight: 600, color: "var(--dashboard-accent)" }}>{department?.name || "Loading..."}</p>
            <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.25rem" }}>Dues: GHS {department?.dues_amount?.toFixed(2) || "0.00"}</p>
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
              <h2 style={{ fontSize: "1.5rem", color: "var(--primary)" }}>
                {pathname === "/admin/dashboard" && "Dashboard"}
                {pathname === "/admin/roster" && "Student Roster"}
                {pathname === "/admin/import" && "CSV Roster Upload"}
                {pathname === "/admin/transactions" && "Transactions Monitor"}
              </h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                {pathname === "/admin/dashboard" && `Overview for ${department?.name || "..."}`}
                {pathname === "/admin/roster" && `All enrolled students for ${department?.name || "..."}`}
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
    </div>
  );
}
