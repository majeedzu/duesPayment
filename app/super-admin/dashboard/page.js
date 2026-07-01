"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, 
  Users, 
  CreditCard, 
  LogOut, 
  Bell, 
  Plus, 
  Trash2, 
  Edit2, 
  ShieldAlert, 
  BookOpen, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  Check, 
  X, 
  Database,
  Search
} from "lucide-react";
import { getClientSession, clearClientSession } from "@/lib/session";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, departments, admins, audit
  
  // Dashboard Data
  const [stats, setStats] = useState({
    totalStudents: 0,
    paidCount: 0,
    unpaidCount: 0,
    totalRevenue: 0,
    totalDepartments: 0,
    totalAdmins: 0
  });
  const [departments, setDepartments] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [payments, setPayments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Form states
  const [deptForm, setDeptForm] = useState({ id: "", name: "", faculty: "", duesAmount: "" });
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptModalMode, setDeptModalMode] = useState("create"); // create, edit
  
  const [adminForm, setAdminForm] = useState({ email: "", full_name: "", department_id: "" });
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Status indicators
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedFaculties, setExpandedFaculties] = useState({});

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null); // { id, name }
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Admin info popover
  const [adminPopover, setAdminPopover] = useState(null); // admin object

  // Search states
  const [logSearch, setLogSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");

  // Broadcast notice states
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState("");
  const [notifError, setNotifError] = useState("");

  const fetchSuperDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/stats");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login?role=super_admin");
          return;
        }
        throw new Error("Failed to load super admin stats");
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setDepartments(data.data.departments || []);
        setAdmins(data.data.admins || []);
        setPayments(data.data.payments || []);
        setAuditLogs(data.data.auditLogs || []);
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getClientSession();
    if (!session || session.role !== "super_admin") {
      router.push("/auth/login?role=super_admin");
      return;
    }
    // Use a microtask to avoid synchronous setState inside effect
    Promise.resolve().then(() => {
      setAdmin(session);
      fetchSuperDashboardData();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogout = () => {
    clearClientSession();
    router.push("/");
  };

  // --- Department Operations ---
  const handleOpenDeptCreate = () => {
    setDeptForm({ id: "", name: "", faculty: "", duesAmount: "" });
    setDeptModalMode("create");
    setFormError("");
    setFormSuccess("");
    setShowDeptModal(true);
  };

  const handleOpenDeptEdit = (dept) => {
    setDeptForm({
      id: dept.id,
      name: dept.name,
      faculty: dept.faculty,
      duesAmount: String(dept.duesAmount)
    });
    setDeptModalMode("edit");
    setFormError("");
    setFormSuccess("");
    setShowDeptModal(true);
  };

  const handleDeleteDept = (id, name) => {
    setDeptToDelete({ id, name });
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const confirmDeleteDept = async () => {
    if (!deptToDelete) return;
    setActionLoading(true);
    setFormError("");
    setFormSuccess("");
    setShowDeleteModal(false);
    try {
      const res = await fetch("/api/super-admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: deptToDelete.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to delete department.");
      setFormSuccess(`"${deptToDelete.name}" deleted successfully!`);
      setDeptToDelete(null);
      await fetchSuperDashboardData();
    } catch (err) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/super-admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: deptModalMode,
          id: deptForm.id,
          name: deptForm.name,
          faculty: deptForm.faculty,
          duesAmount: parseFloat(deptForm.duesAmount)
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFormSuccess(deptModalMode === "create" ? "Department created successfully!" : "Department details updated!");
        fetchSuperDashboardData();
        setTimeout(() => setShowDeptModal(false), 1200);
      } else {
        setFormError(data.message || "Failed to process department operation.");
      }
    } catch (err) {
      setFormError("Server connection error.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- Administrator Operations ---
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setActionLoading(true);

    try {
      const response = await fetch("/api/super-admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          email: adminForm.email,
          full_name: adminForm.full_name,
          department_id: adminForm.department_id
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFormSuccess("Administrator assigned successfully! Default password is 'password123'.");
        setAdminForm({ email: "", full_name: "", department_id: "" });
        fetchSuperDashboardData();
        setTimeout(() => setShowAdminModal(false), 1500);
      } else {
        setFormError(data.message || "Failed to assign administrator.");
      }
    } catch (err) {
      setFormError("Server connection error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setSendingNotif(true);
    setNotifSuccess("");
    setNotifError("");

    try {
      const res = await fetch("/api/super-admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notifTitle, message: notifMessage })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setNotifSuccess("Broadcast notice successfully sent to all department administrators!");
        setNotifTitle("");
        setNotifMessage("");
      } else {
        setNotifError(result.message || "Failed to send notification.");
      }
    } catch (err) {
      setNotifError("Network connection error.");
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDeleteAdmin = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name} as a department administrator?`)) return;

    try {
      const response = await fetch("/api/super-admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        fetchSuperDashboardData();
      } else {
        alert(data.message || "Failed to remove administrator.");
      }
    } catch (err) {
      alert("Server connection error.");
    }
  };

  const getDeptName = (id) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : "N/A (Super Admin)";
  };

  // Search Filtered Lists
  const filteredLogs = auditLogs.filter(log => {
    const term = logSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      (log.profiles?.full_name && log.profiles.full_name.toLowerCase().includes(term)) ||
      (log.profiles?.email && log.profiles.email.toLowerCase().includes(term))
    );
  });

  const filteredAdmins = admins.filter(a => {
    const term = adminSearch.toLowerCase();
    return (
      a.full_name.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      getDeptName(a.department_id).toLowerCase().includes(term)
    );
  });

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

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="htu-logo-container" style={{ width: "40px", height: "40px" }}>
            <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
          </div>
          <div>
            <h4 style={{ color: "white" }}>HTU Dues</h4>
            <span style={{ fontSize: "0.75rem", color: "var(--dashboard-accent)", fontWeight: 700 }}>SUPER ADMIN</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <div style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", opacity: 0.6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Control Center
          </div>
          <button 
            onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }} 
            className={`sidebar-link ${activeTab === "overview" ? "active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
          >
            <Database size={18} /> Overview & Stats
          </button>
          <button 
            onClick={() => { setActiveTab("departments"); setSidebarOpen(false); }} 
            className={`sidebar-link ${activeTab === "departments" ? "active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
          >
            <BookOpen size={18} /> Manage Departments
          </button>
          <button 
            onClick={() => { setActiveTab("admins"); setSidebarOpen(false); }} 
            className={`sidebar-link ${activeTab === "admins" ? "active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
          >
            <Users size={18} /> Dept Administrators
          </button>
          <button 
            onClick={() => { setActiveTab("audit"); setSidebarOpen(false); }} 
            className={`sidebar-link ${activeTab === "audit" ? "active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
          >
            <FileText size={18} /> System Audit Logs
          </button>
          <button 
            onClick={() => { setActiveTab("notifications"); setSidebarOpen(false); }} 
            className={`sidebar-link ${activeTab === "notifications" ? "active" : ""}`}
            style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
          >
            <Bell size={18} /> Broadcast Alerts
          </button>
        </div>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "35px", height: "35px", borderRadius: "50%", backgroundColor: "var(--dashboard-accent)", display: "flex", alignItems: "center", justifyCenter: "center", color: "white", fontWeight: 700, justifyContent: "center" }}>
              {admin?.full_name?.charAt(0) || "S"}
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

      {/* Main Content */}
      <main className="main-content">
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
              <h2 style={{ fontSize: "1.5rem", color: "var(--primary)" }}>Super Admin Panel</h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Ho Technical University Institutional Overview</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button 
              onClick={fetchSuperDashboardData} 
              className="btn btn-outline" 
              style={{ borderRadius: "50%", padding: "0.6rem", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Refresh Stats"
            >
              <RefreshCw size={18} className={loading ? "spinner" : ""} />
            </button>
          </div>
        </header>

        {/* Dashboard Panels */}
        <div className="content-body">

          {/* Stats Bar */}
          <div className="grid grid-cols-4" style={{ marginBottom: "2rem" }}>
            <div className="card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
              <div>
                <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 600 }}>Total Revenue (GHS)</span>
                <div className="stat-value" style={{ color: "var(--primary)" }}>GHS {stats.totalRevenue.toFixed(2)}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(0, 55, 114, 0.1)", color: "var(--primary)" }}>
                <CreditCard size={22} />
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
              <div>
                <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 600 }}>Total Students Enrolled</span>
                <div className="stat-value">{stats.totalStudents}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
                <Users size={22} />
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: "4px solid var(--accent-crimson)" }}>
              <div>
                <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 600 }}>Departments</span>
                <div className="stat-value">{stats.totalDepartments}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--warning-bg)", color: "var(--accent-crimson)" }}>
                <BookOpen size={22} />
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: "4px solid var(--accent-crimson)" }}>
              <div>
                <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 600 }}>Active Administrators</span>
                <div className="stat-value">{stats.totalAdmins}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--danger-bg)", color: "var(--accent-crimson)" }}>
                <Shield size={22} />
              </div>
            </div>
          </div>

          {/* OVERVIEW PANEL */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div>
                    <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>University Departments Summary</h3>
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>Breakdown of roster sizes, fees, and payments per department.</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={handleOpenDeptCreate} className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
                      <Plus size={16} /> New Department
                    </button>
                    <button onClick={() => setShowAdminModal(true)} className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
                      <Plus size={16} /> Assign Admin
                    </button>
                  </div>
                </div>

                {/* Faculty-grouped department sections */}
                {departments.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>No departments configured.</p>
                ) : (
                  (() => {
                    const grouped = departments.reduce((acc, dept) => {
                      const key = dept.faculty || "Unassigned";
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(dept);
                      return acc;
                    }, {});
                    return Object.entries(grouped).map(([faculty, depts]) => {
                      const isOpen = expandedFaculties[`overview-${faculty}`] !== false;
                      const totalRevenue = depts.reduce((s, d) => s + (d.revenue || 0), 0);
                      const totalStudents = depts.reduce((s, d) => s + (d.totalStudents || 0), 0);
                      return (
                        <div key={faculty} style={{ marginBottom: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                          <button
                            onClick={() => setExpandedFaculties(p => ({ ...p, [`overview-${faculty}`]: !isOpen }))}
                            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", gap: "1rem" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{faculty}</span>
                              <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(255,255,255,0.2)", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>{depts.length} dept{depts.length > 1 ? "s" : ""}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "0.8rem", opacity: 0.85 }}>
                              <span>{totalStudents} students</span>
                              <span>GHS {totalRevenue.toFixed(2)} collected</span>
                              <span style={{ fontSize: "1rem" }}>{isOpen ? "▲" : "▼"}</span>
                            </div>
                          </button>
                          {isOpen && (
                            <div className="table-container" style={{ margin: 0 }}>
                              <table className="table" style={{ margin: 0 }}>
                                <thead>
                                  <tr>
                                    <th>Department</th>
                                    <th>Dues Fee</th>
                                    <th>Students</th>
                                    <th>Paid</th>
                                    <th>Unpaid</th>
                                    <th>Revenue</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {depts.map(dept => (
                                    <tr key={dept.id}>
                                      <td style={{ fontWeight: 700 }}>{dept.name}</td>
                                      <td style={{ fontWeight: 600 }}>GHS {dept.duesAmount.toFixed(2)}</td>
                                      <td>{dept.totalStudents}</td>
                                      <td style={{ color: "var(--success)", fontWeight: 600 }}>{dept.paidCount}</td>
                                      <td style={{ color: "var(--danger)", fontWeight: 600 }}>{dept.unpaidCount}</td>
                                      <td style={{ fontWeight: 700, color: "var(--primary)" }}>GHS {dept.revenue.toFixed(2)}</td>
                                      <td>
                                        {(() => {
                                          const assignedAdmin = admins.find(a => a.department_id === dept.id);
                                          return assignedAdmin ? (
                                            <button
                                              onClick={() => setAdminPopover(assignedAdmin)}
                                              style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px", backgroundColor: "var(--success-bg)", color: "var(--success)", whiteSpace: "nowrap", border: "none", cursor: "pointer" }}
                                              title="Click to view admin details"
                                            >
                                              <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block" }} /> Admin Active
                                            </button>
                                          ) : (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px", backgroundColor: "var(--warning-bg)", color: "#b45309", whiteSpace: "nowrap" }}>
                                              <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#f59e0b", display: "inline-block" }} /> No Admin
                                            </span>
                                          );
                                        })()}
                                      </td>
                                      <td>
                                        <div style={{ display: "flex", gap: "0.35rem" }}>
                                          <button onClick={() => handleOpenDeptEdit(dept)} className="btn btn-outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><Edit2 size={12} /> Edit</button>
                                          <button onClick={() => handleDeleteDept(dept.id, dept.name)} className="btn btn-outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--danger)", borderColor: "rgba(239,68,68,0.2)" }} disabled={actionLoading}><Trash2 size={12} /> Delete</button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </div>

              {/* Recent System Payments */}
              <div className="card">
                <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", marginBottom: "1rem" }}>Recent Institutional Payments</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Student Index</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Receipt ID</th>
                        <th>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>No payments recorded.</td>
                        </tr>
                      ) : (
                        payments.slice(0, 10).map((pay) => (
                          <tr key={pay.id}>
                            <td style={{ fontSize: "0.85rem", opacity: 0.8 }}>{pay.paystack_reference}</td>
                            <td style={{ fontWeight: 600 }}>{pay.student_index_number}</td>
                            <td style={{ fontWeight: 700 }}>GHS {pay.amount.toFixed(2)}</td>
                            <td>
                              <span className={`badge ${pay.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                                {pay.status}
                              </span>
                            </td>
                            <td style={{ fontStyle: "italic", fontSize: "0.85rem" }}>{pay.receipt_id || "N/A"}</td>
                            <td style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                              {pay.payment_date ? new Date(pay.payment_date).toLocaleString() : new Date(pay.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DEPARTMENTS PANEL */}
          {activeTab === "departments" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                  <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Manage University Departments</h3>
                  <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>Configure academic departments, faculty groupings, and due levels.</p>
                </div>
                <button onClick={handleOpenDeptCreate} className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
                  <Plus size={16} /> Add Department
                </button>
              </div>

              {/* Faculty-grouped department management */}
              {departments.length === 0 ? (
                <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>No departments configured. Add one above.</p>
              ) : (
                (() => {
                  const grouped = departments.reduce((acc, dept) => {
                    const key = dept.faculty || "Unassigned";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(dept);
                    return acc;
                  }, {});
                  return Object.entries(grouped).map(([faculty, depts]) => {
                    const isOpen = expandedFaculties[`manage-${faculty}`] !== false;
                    return (
                      <div key={faculty} style={{ marginBottom: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                        <button
                          onClick={() => setExpandedFaculties(p => ({ ...p, [`manage-${faculty}`]: !isOpen }))}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem", background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <BookOpen size={16} />
                            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{faculty}</span>
                            <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(255,255,255,0.2)", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>{depts.length} dept{depts.length > 1 ? "s" : ""}</span>
                          </div>
                          <span style={{ fontSize: "1rem" }}>{isOpen ? "▲" : "▼"}</span>
                        </button>
                        {isOpen && (
                          <div className="table-container" style={{ margin: 0 }}>
                            <table className="table" style={{ margin: 0 }}>
                              <thead>
                                <tr>
                                  <th>Department Name</th>
                                  <th>Dues Amount (GHS)</th>
                                  <th>Admin Status</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {depts.map(dept => (
                                  <tr key={dept.id}>
                                    <td style={{ fontWeight: 700 }}>{dept.name}</td>
                                    <td style={{ fontWeight: 700, color: "var(--primary)" }}>GHS {dept.duesAmount.toFixed(2)}</td>
                                    <td>
                                      {(() => {
                                        const assignedAdmin = admins.find(a => a.department_id === dept.id);
                                        return assignedAdmin ? (
                                          <button
                                            onClick={() => setAdminPopover(assignedAdmin)}
                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px", backgroundColor: "var(--success-bg)", color: "var(--success)", whiteSpace: "nowrap", border: "none", cursor: "pointer" }}
                                            title="Click to view admin details"
                                          >
                                            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block" }} /> Admin Active
                                          </button>
                                        ) : (
                                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "999px", backgroundColor: "var(--warning-bg)", color: "#b45309", whiteSpace: "nowrap" }}>
                                            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#f59e0b", display: "inline-block" }} /> No Admin
                                          </span>
                                        );
                                      })()}
                                    </td>
                                    <td>
                                      <div style={{ display: "flex", gap: "0.35rem" }}>
                                        <button onClick={() => handleOpenDeptEdit(dept)} className="btn btn-outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><Edit2 size={12} /> Edit</button>
                                        <button onClick={() => handleDeleteDept(dept.id, dept.name)} className="btn btn-outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--danger)", borderColor: "rgba(239,68,68,0.2)" }} disabled={actionLoading}><Trash2 size={12} /> Delete</button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          )}

          {/* ADMINS PANEL */}
          {activeTab === "admins" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Department Administrators</h3>
                  <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>Assign or remove administrators responsible for uploading CSV rosters.</p>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ position: "relative", minWidth: "220px" }}>
                    <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
                    <input
                      type="text"
                      placeholder="Search admins..."
                      className="input"
                      style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.85rem" }}
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                    />
                  </div>
                  <button onClick={() => setShowAdminModal(true)} className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Plus size={16} /> Assign Administrator
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email Address</th>
                      <th>Assigned Department</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map((adm) => (
                      <tr key={adm.id}>
                        <td style={{ fontWeight: 600 }}>{adm.full_name}</td>
                        <td style={{ fontSize: "0.9rem" }}>{adm.email}</td>
                        <td style={{ fontWeight: 700, color: "var(--primary)" }}>{getDeptName(adm.department_id)}</td>
                        <td>
                          <span className={`badge ${adm.role === 'super_admin' ? 'badge-danger' : 'badge-info'}`}>
                            {adm.role === 'super_admin' ? 'Super Admin' : 'Dept Admin'}
                          </span>
                        </td>
                        <td>
                          {adm.role !== 'super_admin' && (
                            <button 
                              onClick={() => handleDeleteAdmin(adm.id, adm.full_name)} 
                              className="btn btn-outline" 
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT LOG PANEL */}
          {activeTab === "audit" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>System Audit Trail</h3>
                  <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>A read-only log recording administrative actions for security tracking.</p>
                </div>

                <div style={{ position: "relative", minWidth: "250px" }}>
                  <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
                  <input
                    type="text"
                    placeholder="Search action, actor, details..."
                    className="input"
                    style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.85rem" }}
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-container" style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Actor</th>
                      <th>Action Code</th>
                      <th>Activity Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>No matching logs found.</td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontSize: "0.8rem", opacity: 0.6, whiteSpace: "nowrap" }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td style={{ fontSize: "0.85rem" }}>
                            {log.profiles ? (
                              <div>
                                <p style={{ fontWeight: 600 }}>{log.profiles.full_name}</p>
                                <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>{log.profiles.email}</span>
                              </div>
                            ) : (
                              <span style={{ fontStyle: "italic", opacity: 0.5 }}>System Automation</span>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>{log.action}</span>
                          </td>
                          <td style={{ fontSize: "0.85rem", opacity: 0.9 }}>{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BROADCAST ALERT PANEL */}
          {activeTab === "notifications" && (
            <div className="card">
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", margin: 0 }}>Broadcast Alerts to Admins</h3>
                <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>Send global admin dashboard alerts to all registered department administrators.</p>
              </div>

              {notifSuccess && (
                <div className="badge badge-success" style={{ display: "block", marginBottom: "1rem", padding: "0.5rem 1rem", textTransform: "none", width: "100%" }}>
                  {notifSuccess}
                </div>
              )}
              {notifError && (
                <div className="badge badge-danger" style={{ display: "block", marginBottom: "1rem", padding: "0.5rem 1rem", textTransform: "none", width: "100%" }}>
                  {notifError}
                </div>
              )}

              <form onSubmit={handleSendNotification} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "600px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.7 }}>Alert Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. System Maintenance Window" 
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      fontSize: "0.9rem",
                      outline: "none"
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.7 }}>Alert Message</label>
                  <textarea 
                    placeholder="Write your alert message details here..." 
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    required
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      fontSize: "0.9rem",
                      outline: "none",
                      resize: "none"
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ alignSelf: "flex-start", padding: "0.65rem 1.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}
                  disabled={sendingNotif}
                >
                  {sendingNotif ? 'Sending alert...' : 'Broadcast Alert'}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* ADMIN INFO POPOVER */}
      {adminPopover && (
        <div className="modal-overlay" onClick={() => setAdminPopover(null)}>
          <div className="modal" style={{ maxWidth: "380px" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setAdminPopover(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", border: "none", background: "none", cursor: "pointer", opacity: 0.5 }}
            >
              <X size={18} />
            </button>

            {/* Avatar + Name */}
            <div style={{ textAlign: "center", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{
                width: 70, height: 70, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem",
                fontSize: "1.75rem", fontWeight: 800, color: "white",
                boxShadow: "0 4px 16px rgba(0,0,139,0.25)"
              }}>
                {adminPopover.full_name?.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--primary)", marginBottom: "0.3rem" }}>
                {adminPopover.full_name}
              </h3>
              <span className="badge badge-info" style={{ fontSize: "0.72rem" }}>
                {adminPopover.role === "super_admin" ? "Super Admin" : "Dept Admin"}
              </span>
            </div>

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", padding: "1.25rem 0 0.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "rgba(0,0,139,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.9rem" }}>✉️</span>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", opacity: 0.5, marginBottom: "0.1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</p>
                  <p style={{ fontWeight: 600, fontSize: "0.88rem", wordBreak: "break-all" }}>{adminPopover.email}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "rgba(0,0,139,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.9rem" }}>🏛️</span>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", opacity: 0.5, marginBottom: "0.1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned Department</p>
                  <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--primary)" }}>
                    {getDeptName(adminPopover.department_id) || "Not assigned"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", opacity: 0.5, marginBottom: "0.1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</p>
                  <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--success)" }}>Active Administrator</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAdminPopover(null)}
              className="btn btn-outline"
              style={{ width: "100%", marginTop: "1.25rem" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DELETE DEPARTMENT CONFIRMATION MODAL */}
      {showDeleteModal && deptToDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "460px" }}>
            <div style={{ textAlign: "center", padding: "0.5rem 0 1.5rem" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", backgroundColor: "var(--danger-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Trash2 size={28} style={{ color: "var(--danger)" }} />
              </div>
              <h3 style={{ color: "var(--danger)", fontFamily: "var(--font-heading)", marginBottom: "0.5rem" }}>Delete Department?</h3>
              <p style={{ fontSize: "0.9rem", opacity: 0.75, lineHeight: 1.6 }}>
                You are about to permanently delete:
              </p>
              <div style={{ margin: "1rem 0", padding: "0.75rem 1rem", backgroundColor: "var(--danger-bg)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius)" }}>
                <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--danger)" }}>{deptToDelete.name}</p>
              </div>
              <p style={{ fontSize: "0.8rem", opacity: 0.65, lineHeight: 1.6, marginBottom: "1.5rem" }}>
                ⚠️ Student roster and payment records linked to this department will remain in the database, but their department ties will be cleared. <strong>This cannot be undone.</strong>
              </p>
              <div className="form-group" style={{ textAlign: "left", marginBottom: "1.25rem" }}>
                <label className="label" style={{ marginBottom: "0.4rem", display: "block" }}>
                  Type <strong style={{ color: "var(--danger)" }}>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Type DELETE here..."
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeptToDelete(null); }}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDept}
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={deleteConfirmText !== "DELETE" || actionLoading}
                >
                  <Trash2 size={15} /> {actionLoading ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>
                {deptModalMode === "create" ? "Add Department" : "Edit Department Details"}
              </h3>
              <button onClick={() => setShowDeptModal(false)} style={{ border: "none", background: "none", cursor: "pointer", opacity: 0.6 }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="badge badge-danger" style={{ padding: "0.6rem 1rem", borderRadius: "var(--radius)", width: "100%", textTransform: "none", display: "flex", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.8rem" }}>
                <ShieldAlert size={16} /> {formError}
              </div>
            )}
            {formSuccess && (
              <div className="badge badge-success" style={{ padding: "0.6rem 1rem", borderRadius: "var(--radius)", width: "100%", textTransform: "none", display: "flex", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.8rem" }}>
                <Check size={16} /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleDeptSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="label">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g., Computer Science"
                  className="input"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Faculty</label>
                <select
                  className="select"
                  value={deptForm.faculty}
                  onChange={(e) => setDeptForm({ ...deptForm, faculty: e.target.value })}
                  required
                >
                  <option value="">-- Choose Faculty --</option>
                  <option value="Faculty of Applied Sciences and Technology">Faculty of Applied Sciences and Technology</option>
                  <option value="Faculty of Engineering">Faculty of Engineering</option>
                  <option value="Faculty of Art and Design">Faculty of Art and Design</option>
                  <option value="Faculty of Business and Management Studies">Faculty of Business and Management Studies</option>
                  <option value="Faculty of Applied Social Sciences">Faculty of Applied Social Sciences</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Dues Amount (GHS)</label>
                <input
                  type="number"
                  placeholder="e.g., 150"
                  className="input"
                  value={deptForm.duesAmount}
                  onChange={(e) => setDeptForm({ ...deptForm, duesAmount: e.target.value })}
                  required
                  min="1"
                  step="0.01"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={actionLoading}>
                {actionLoading ? "Processing..." : deptModalMode === "create" ? "Create Department" : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN REGISTRATION MODAL */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Assign Department Administrator</h3>
              <button onClick={() => setShowAdminModal(false)} style={{ border: "none", background: "none", cursor: "pointer", opacity: 0.6 }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="badge badge-danger" style={{ padding: "0.6rem 1rem", borderRadius: "var(--radius)", width: "100%", textTransform: "none", display: "flex", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.8rem" }}>
                <ShieldAlert size={16} /> {formError}
              </div>
            )}
            {formSuccess && (
              <div className="badge badge-success" style={{ padding: "0.6rem 1rem", borderRadius: "var(--radius)", width: "100%", textTransform: "none", display: "flex", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.8rem" }}>
                <Check size={16} /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleAdminSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., Prof. Alex Kumi"
                  className="input"
                  value={adminForm.full_name}
                  onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Institutional Email</label>
                <input
                  type="email"
                  placeholder="e.g., akumi@htu.edu.gh"
                  className="input"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                />
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>Must end in @htu.edu.gh</span>
              </div>

              <div className="form-group">
                <label className="label">Assign Department</label>
                <select
                  className="select"
                  value={adminForm.department_id}
                  onChange={(e) => setAdminForm({ ...adminForm, department_id: e.target.value })}
                  required
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.5rem 0.75rem", backgroundColor: "rgba(245, 158, 11, 0.05)", border: "1px dashed rgba(245, 158, 11, 0.2)", borderRadius: "var(--radius)", fontSize: "0.75rem" }}>
                <AlertCircle size={16} style={{ color: "var(--accent-crimson)", flexShrink: 0, marginTop: "2px" }} />
                <p style={{ opacity: 0.8 }}>
                  The administrator will be created with a temporary password of <strong>password123</strong>. A password reset email will be sent automatically so they can set their own password. Please inform them to check their inbox.
                </p>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={actionLoading}>
                {actionLoading ? "Processing..." : "Create Account & Assign"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
