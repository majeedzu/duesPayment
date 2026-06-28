"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  LogOut, 
  Bell, 
  Search, 
  Upload, 
  Download, 
  Check, 
  X, 
  ShieldAlert, 
  BookOpen, 
  AlertCircle, 
  RefreshCw, 
  Filter, 
  FileText,
  ChevronRight
} from "lucide-react";
import { getClientSession, clearClientSession } from "@/lib/session";
import Papa from "papaparse";

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    paidCount: 0,
    unpaidCount: 0,
    totalRevenue: 0
  });
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [department, setDepartment] = useState(null);
  
  // UI states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const itemsPerPage = 10;

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
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login?role=dept_admin");
          return;
        }
        throw new Error("Failed to load dashboard data");
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setStudents(data.data.students || []);
        setPayments(data.data.payments || []);
        setNotifications(data.data.notifications || []);
        setDepartment(data.data.department);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearClientSession();
    router.push("/");
  };

  // CSV Drag and Drop Ingestion
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCSV(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processCSV(e.target.files[0]);
    }
  };

  const processCSV = (file) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setImportErrors(["Invalid file format. Please upload a standard CSV file."]);
      return;
    }

    setImporting(true);
    setImportErrors([]);
    setImportSuccess(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          setImportErrors(["The uploaded CSV file is empty."]);
          setImporting(false);
          return;
        }

        // Validate required headers
        const firstRow = rows[0];
        const requiredHeaders = ["index_number", "full_name", "email", "programme", "level", "faculty"];
        const missingHeaders = requiredHeaders.filter(h => !Object.keys(firstRow).includes(h));

        if (missingHeaders.length > 0) {
          setImportErrors([`Invalid CSV columns. Missing headers: ${missingHeaders.join(", ")}`]);
          setImporting(false);
          return;
        }

        try {
          const response = await fetch("/api/csv/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              students: rows,
              departmentId: admin.department_id || department?.id
            })
          });

          const data = await response.json();
          if (response.ok && data.success) {
            let msg = `Roster updated! Imported ${data.imported} students`;
            if (data.manualPayments > 0) msg += `, ${data.manualPayments} manual payment(s) recorded`;
            if (data.skipped > 0) msg += `, ${data.skipped} invalid rows skipped`;
            setImportSuccess(msg + '.');
            if (data.errors && data.errors.length > 0) {
              setImportErrors(data.errors.slice(0, 5)); // show first 5 warnings
            }
            fetchDashboardData();
          } else {
            setImportErrors([data.message || "Failed to process the student records."]);
          }
        } catch (error) {
          setImportErrors(["Error connecting to server. Please try again."]);
        } finally {
          setImporting(false);
        }
      },
      error: () => {
        setImportErrors(["Failed to read the CSV file."]);
        setImporting(false);
      }
    });
  };

  // Export current student list to CSV
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    
    const csvContent = [
      ["Index Number", "Full Name", "Email", "Programme", "Level", "Faculty", "Dues Payment Status"],
      ...filteredStudents.map(s => [
        s.index_number,
        s.full_name,
        s.email,
        s.programme,
        s.level,
        s.faculty,
        s.isPaid ? "Paid" : "Unpaid"
      ])
    ]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${department?.name || "Department"}_student_dues_list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample CSV
  const handleDownloadTemplate = () => {
    const csvContent = [
      ["index_number", "full_name", "email", "programme", "level", "faculty", "paid_status"],
      ["0322080456", "John Doe", "0322080456@htu.edu.gh", "BTech Computer Science", "400", "Faculty of Applied Sciences and Technology", ""],
      ["0322080999", "Jane Smith", "0322080999@htu.edu.gh", "BTech Computer Science", "300", "Faculty of Applied Sciences and Technology", "paid"]
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `htu_student_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search & Filtering
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      student.index_number.includes(search) ||
      student.programme.toLowerCase().includes(search.toLowerCase()) ||
      student.level.includes(search);
      
    if (statusFilter === "paid") return matchesSearch && student.isPaid;
    if (statusFilter === "unpaid") return matchesSearch && !student.isPaid;
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

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
          <div className="htu-logo-container" style={{ width: "40px", height: "40px", border: "2px solid var(--accent-crimson)" }}>
            <img src="/htu_logo.jpg" alt="HTU Logo" className="htu-logo-img" />
          </div>
          <div>
            <h4 style={{ color: "white" }}>HTU Dues</h4>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-crimson)", fontWeight: 600 }}>ADMIN PORTAL</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <div style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", opacity: 0.6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Overview
          </div>
          <Link href="/admin/dashboard" className="sidebar-link active">
            <Users size={18} /> Student Roster
          </Link>
          <div style={{ marginTop: "1rem", padding: "0.5rem 1rem", fontSize: "0.75rem", opacity: 0.6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Department Info
          </div>
          <div style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", opacity: 0.9, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "var(--radius)" }}>
            <p style={{ fontWeight: 600, color: "var(--accent-crimson)" }}>{department?.name || "Loading..."}</p>
            <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.25rem" }}>Dues: GHS {department?.dues_amount?.toFixed(2) || "0.00"}</p>
          </div>
        </div>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ width: "35px", height: "35px", borderRadius: "50%", backgroundColor: "var(--accent-crimson)", display: "flex", alignItems: "center", justifyCenter: "center", color: "#fff", fontWeight: 700, justifyContent: "center" }}>
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
              <h2 style={{ fontSize: "1.5rem", color: "var(--primary)" }}>Department Dashboard</h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Roster and transaction logs for {department?.name || "..."}</p>
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
                  <span style={{ position: "absolute", top: "4px", right: "4px", width: "10px", height: "10px", backgroundColor: "var(--accent-crimson)", borderRadius: "50%" }}></span>
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
                  <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
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
              onClick={fetchDashboardData} 
              className="btn btn-outline" 
              style={{ borderRadius: "50%", padding: "0.6rem", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Refresh Stats"
            >
              <RefreshCw size={18} className={loading ? "spinner" : ""} />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="content-body">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-4" style={{ marginBottom: "2rem" }}>
            <div className="card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
              <div>
                <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 600 }}>Total Students</span>
                <div className="stat-value">{stats.totalStudents}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(0, 55, 114, 0.1)", color: "var(--primary)" }}>
                <Users size={22} />
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
              <div>
                <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 600 }}>Paid Dues</span>
                <div className="stat-value" style={{ color: "var(--success)" }}>{stats.paidCount}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
                <Check size={22} />
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: "4px solid var(--danger)" }}>
              <div>
                <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 600 }}>Unpaid Dues</span>
                <div className="stat-value" style={{ color: "var(--danger)" }}>{stats.unpaidCount}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
                <X size={22} />
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
              <div>
                <span style={{ fontSize: "0.85rem", opacity: 0.7, fontWeight: 600 }}>Total Revenue</span>
                <div className="stat-value" style={{ color: "var(--primary)" }}>GHS {stats.totalRevenue.toFixed(2)}</div>
              </div>
              <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(var(--primary-rgb), 0.08)", color: "var(--primary)" }}>
                <CreditCard size={22} />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr", gap: "2rem", marginBottom: "2rem" }}>
            
            {/* CSV Import Panel */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Upload Student Roster</h3>
                  <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>Import students to the database using a `.csv` file format.</p>
                </div>
                <button onClick={handleDownloadTemplate} className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
                  <Download size={14} /> Template
                </button>
              </div>

              {/* Upload Zone */}
              <div 
                className={`upload-zone ${dragActive ? "active" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("csv-file-input").click()}
              >
                <input 
                  type="file" 
                  id="csv-file-input" 
                  accept=".csv" 
                  style={{ display: "none" }} 
                  onChange={handleFileChange}
                />
                <Upload size={32} style={{ color: "var(--primary)", opacity: 0.7 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {importing ? "Processing CSV File..." : "Drag and drop your CSV here"}
                  </p>
                  <p style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem" }}>
                    or click to browse from computer
                  </p>
                </div>
              </div>

              {/* CSV Schema Alert */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(var(--primary-rgb), 0.04)", borderRadius: "var(--radius)", fontSize: "0.75rem" }}>
                <BookOpen size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong style={{ color: "var(--primary)" }}>Required Columns:</strong>
                  <p style={{ opacity: 0.8, marginTop: "0.25rem", fontStyle: "italic" }}>
                    index_number, full_name, email, programme, level, faculty
                  </p>
                  <p style={{ opacity: 0.8, marginTop: "0.25rem", fontStyle: "italic" }}>
                    <strong>Optional:</strong> paid_status (set to <code>paid</code> to record a manual cash payment)
                  </p>
                  <p style={{ opacity: 0.6, marginTop: "0.25rem" }}>
                    Emails must end with <code>@htu.edu.gh</code> to be accepted.
                  </p>
                </div>
              </div>

              {/* Upload Status Feedbacks */}
              {importSuccess && (
                <div className="badge badge-success" style={{ padding: "0.75rem 1rem", width: "100%", borderRadius: "var(--radius)", textTransform: "none", display: "flex", gap: "0.5rem", fontSize: "0.8rem", fontWeight: 500 }}>
                  <Check size={16} /> {importSuccess}
                </div>
              )}

              {importErrors.length > 0 && (
                <div style={{ backgroundColor: "var(--danger-bg)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "1rem", borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)", fontWeight: 700, fontSize: "0.85rem" }}>
                    <ShieldAlert size={16} /> Import Warnings
                  </div>
                  <ul style={{ paddingLeft: "1.25rem", fontSize: "0.75rem", opacity: 0.8, color: "var(--foreground)" }}>
                    {importErrors.map((err, i) => (
                      <li key={i} style={{ marginBottom: "0.25rem" }}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recent Payments Log */}
            <div className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Transactions Monitor</h3>
                <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>Live receipts verification logs and references.</p>
              </div>

              <div style={{ flexGrow: 1, overflowY: "auto", maxHeight: "310px" }}>
                {payments.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", opacity: 0.6, textAlign: "center", padding: "3rem 0" }}>No transactions logged yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {payments.slice(0, 5).map((pay) => (
                      <div 
                        key={pay.id} 
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "between", 
                          padding: "0.75rem", 
                          borderRadius: "var(--radius)", 
                          border: "1px solid var(--border)",
                          backgroundColor: "rgba(255,255,255,0.02)"
                        }}
                      >
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Index: {pay.student_index_number}</span>
                            <span className={`badge ${pay.status === 'success' ? 'badge-success' : pay.status === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: "0.6rem", padding: "0.15rem 0.4rem" }}>
                              {pay.status}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem" }}>Ref: {pay.paystack_reference}</p>
                          <span style={{ fontSize: "0.65rem", opacity: 0.4 }}>{pay.payment_date ? new Date(pay.payment_date).toLocaleString() : new Date(pay.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ textAlign: "right", marginLeft: "1rem" }}>
                          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--primary)" }}>GHS {pay.amount.toFixed(2)}</span>
                          {pay.receipt_id && (
                            <Link 
                              href={`/verify/${pay.receipt_id}`} 
                              target="_blank" 
                              style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "var(--secondary)", marginTop: "0.25rem", justifyContent: "flex-end" }}
                            >
                              Verify <ChevronRight size={10} />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Roster Table Directory */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Student Directory</h3>
                <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>Search, filter, and manage enrolled students.</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                {/* Search Bar */}
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
                  <input
                    type="text"
                    placeholder="Search by name, index..."
                    className="input"
                    style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.85rem" }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Filter Select */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.25rem 0.5rem", backgroundColor: "var(--card-bg)" }}>
                  <Filter size={14} style={{ opacity: 0.6 }} />
                  <select 
                    style={{ border: "none", background: "none", outline: "none", fontSize: "0.85rem", cursor: "pointer", paddingRight: "0.5rem" }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid Only</option>
                    <option value="unpaid">Unpaid Only</option>
                  </select>
                </div>

                {/* Export Button */}
                <button 
                  onClick={handleExportCSV} 
                  className="btn btn-outline" 
                  style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  disabled={filteredStudents.length === 0}
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Index Number</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Programme</th>
                    <th>Level</th>
                    <th>Faculty</th>
                    <th>Dues Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "3rem", opacity: 0.6 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                          <AlertCircle size={28} />
                          <span>No students match the search criteria.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => (
                      <tr key={student.index_number}>
                        <td style={{ fontWeight: 700, fontSize: "0.9rem" }}>{student.index_number}</td>
                        <td>{student.full_name}</td>
                        <td style={{ fontSize: "0.85rem", opacity: 0.8 }}>{student.email}</td>
                        <td style={{ fontSize: "0.85rem" }}>{student.programme}</td>
                        <td style={{ fontSize: "0.85rem" }}>L{student.level}</td>
                        <td style={{ fontSize: "0.8rem", opacity: 0.7 }}>{student.faculty}</td>
                        <td>
                          <span className={`badge ${student.isPaid ? 'badge-success' : 'badge-danger'}`}>
                            {student.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", marginTop: "1rem" }}>
                <span style={{ opacity: 0.6 }}>
                  Showing {Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredStudents.length, currentPage * itemsPerPage)} of {filteredStudents.length} students
                </span>
                
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="btn btn-outline" 
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                  >
                    Previous
                  </button>
                  <span style={{ display: "flex", alignItems: "center", padding: "0 0.5rem", fontWeight: 600 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    className="btn btn-outline" 
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
