"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CreditCard,
  Check,
  X,
  AlertCircle,
  Search,
  Download,
  Filter
} from "lucide-react";

export default function AdminRosterPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    paidCount: 0,
    unpaidCount: 0,
    totalRevenue: 0
  });
  const [students, setStudents] = useState([]);
  const [department, setDepartment] = useState(null);

  // UI states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.data.stats);
          setStudents(data.data.students || []);
          setDepartment(data.data.department);
        }
      }
    } catch (error) {
      console.error("Failed to load student roster:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchStudents(); })();
   
  }, []);

  // Export to CSV
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
        s.paymentStatus || (s.isPaid ? "Fully Paid" : "Unpaid")
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

  // Search & Filter
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      student.index_number.includes(search) ||
      student.programme.toLowerCase().includes(search.toLowerCase()) ||
      student.level.includes(search);

    if (statusFilter === "paid") return matchesSearch && student.paymentStatus === "Fully Paid";
    if (statusFilter === "partial") return matchesSearch && (student.paymentStatus === "1st Sem Only" || student.paymentStatus === "2nd Sem Only");
    if (statusFilter === "unpaid") return matchesSearch && student.paymentStatus === "Unpaid";
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    Promise.resolve().then(() => setCurrentPage(1));
  }, [search, statusFilter]);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "300px", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Mini Stats Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" }}>
        <div className="card stat-card" style={{ borderLeft: "4px solid var(--primary)", padding: "1rem 1.25rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase" }}>Enrolled</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-heading)" }}>{stats.totalStudents}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 36, height: 36, backgroundColor: "rgba(0, 55, 114, 0.1)", color: "var(--primary)" }}>
            <Users size={18} />
          </div>
        </div>
        <div className="card stat-card" style={{ borderLeft: "4px solid var(--success)", padding: "1rem 1.25rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase" }}>Fully Paid</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)", fontFamily: "var(--font-heading)" }}>{stats.paidCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 36, height: 36, backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
            <Check size={18} />
          </div>
        </div>
        <div className="card stat-card" style={{ borderLeft: "4px solid #F59E0B", padding: "1rem 1.25rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase" }}>Partially Paid</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F59E0B", fontFamily: "var(--font-heading)" }}>{stats.partiallyPaidCount || 0}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 36, height: 36, backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }}>
            <Check size={18} />
          </div>
        </div>
        <div className="card stat-card" style={{ borderLeft: "4px solid var(--danger)", padding: "1rem 1.25rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase" }}>Unpaid Dues</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--danger)", fontFamily: "var(--font-heading)" }}>{stats.unpaidCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 36, height: 36, backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
            <X size={18} />
          </div>
        </div>
      </div>

      {/* Student Directory Table */}
      <div className="card">
        {/* Table Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", margin: 0 }}>Student Directory</h3>
            <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.2rem" }}>
              Showing {filteredStudents.length} of {students.length} enrolled students
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", minWidth: "220px" }}>
              <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
              <input
                type="text"
                placeholder="Search name, index, programme..."
                className="input"
                style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.85rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.25rem 0.5rem", backgroundColor: "var(--card-bg)" }}>
              <Filter size={14} style={{ opacity: 0.6 }} />
              <select
                style={{ border: "none", background: "none", outline: "none", fontSize: "0.85rem", cursor: "pointer", paddingRight: "0.5rem" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="paid">Fully Paid</option>
                <option value="partial">Partially Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Export */}
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
                      <span className={`badge ${
                        student.paymentStatus === "Fully Paid" 
                          ? "badge-success" 
                          : student.paymentStatus === "1st Sem Only" 
                          ? "badge-info" 
                          : student.paymentStatus === "2nd Sem Only"
                          ? "badge-warning"
                          : "badge-danger"
                      }`}>
                        {student.paymentStatus || (student.isPaid ? "Fully Paid" : "Unpaid")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", marginTop: "1rem" }}>
            <span style={{ opacity: 0.6 }}>
              Showing {Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)}–{Math.min(filteredStudents.length, currentPage * itemsPerPage)} of {filteredStudents.length}
            </span>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-outline"
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
              >
                Previous
              </button>
              <span style={{ fontWeight: 600, padding: "0 0.5rem" }}>Page {currentPage} of {totalPages}</span>
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
  );
}
