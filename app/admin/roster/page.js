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
  Filter,
  Edit,
  Trash2,
  KeyRound
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

  // Student management states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Edit fields
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editProgramme, setEditProgramme] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editFaculty, setEditFaculty] = useState("");

  // Reset password fields
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Action feedback states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

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
    if (statusFilter === "partial") return matchesSearch && student.paymentStatus === "Partially Paid";
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

  // Modal open helpers
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditFullName(student.full_name);
    setEditEmail(student.email);
    setEditProgramme(student.programme);
    setEditLevel(student.level);
    setEditFaculty(student.faculty);
    setActionError("");
    setActionSuccess("");
    setShowEditModal(true);
  };

  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setActionError("");
    setActionSuccess("");
    setShowDeleteModal(true);
  };

  const openResetModal = (student) => {
    setSelectedStudent(student);
    setResetPassword("");
    setResetConfirmPassword("");
    setShowPasswordText(false);
    setActionError("");
    setActionSuccess("");
    setShowResetModal(true);
  };

  // API Call handlers
  const handleEditStudent = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index_number: selectedStudent.index_number,
          full_name: editFullName,
          email: editEmail,
          programme: editProgramme,
          level: editLevel,
          faculty: editFaculty
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update student record.");
      }
      setActionSuccess("Student record updated successfully!");
      await fetchStudents();
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedStudent(null);
      }, 1200);
    } catch (err) {
      setActionError(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch("/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index_number: selectedStudent.index_number
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete student record.");
      }
      setActionSuccess("Student record deleted successfully!");
      await fetchStudents();
      setTimeout(() => {
        setShowDeleteModal(false);
        setSelectedStudent(null);
      }, 1200);
    } catch (err) {
      setActionError(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    if (resetPassword !== resetConfirmPassword) {
      setActionError("Passwords do not match.");
      setActionLoading(false);
      return;
    }

    if (resetPassword.length < 6) {
      setActionError("Password must be at least 6 characters long.");
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email: selectedStudent.email,
          password: resetPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reset student password.");
      }
      setActionSuccess("Student password reset successfully!");
      setTimeout(() => {
        setShowResetModal(false);
        setSelectedStudent(null);
      }, 1200);
    } catch (err) {
      setActionError(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPassword(pass);
    setResetConfirmPassword(pass);
    setShowPasswordText(true);
  };

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
      <div className="roster-stats-grid">
        <div className="card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Enrolled</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, fontFamily: "var(--font-heading)", marginTop: "0.35rem" }}>{stats.totalStudents}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 42, height: 42, backgroundColor: "rgba(0, 55, 114, 0.1)", color: "var(--primary)" }}>
            <Users size={20} />
          </div>
        </div>
        <div className="card stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Fully Paid</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--success)", fontFamily: "var(--font-heading)", marginTop: "0.35rem" }}>{stats.paidCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 42, height: 42, backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
            <Check size={20} />
          </div>
        </div>
        <div className="card stat-card" style={{ borderLeft: "4px solid #F59E0B" }}>
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Partially Paid</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#F59E0B", fontFamily: "var(--font-heading)", marginTop: "0.35rem" }}>{stats.partiallyPaidCount || 0}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 42, height: 42, backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }}>
            <Check size={20} />
          </div>
        </div>
        <div className="card stat-card" style={{ borderLeft: "4px solid var(--danger)" }}>
          <div>
            <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Unpaid Dues</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--danger)", fontFamily: "var(--font-heading)", marginTop: "0.35rem" }}>{stats.unpaidCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 42, height: 42, backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
            <X size={20} />
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
                <th>Dues Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
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
                    <td>
                      <span className={`badge ${
                        student.paymentStatus === "Fully Paid" 
                          ? "badge-success" 
                          : student.paymentStatus === "Partially Paid" 
                          ? "badge-warning"
                          : "badge-danger"
                      }`}>
                        {student.paymentStatus || "Unpaid"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => openEditModal(student)}
                          className="btn btn-outline"
                          style={{ padding: "0.35rem", borderRadius: "8px", minWidth: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}
                          title="Edit Details"
                        >
                          <Edit size={14} style={{ color: "var(--primary)" }} />
                        </button>
                        <button
                          onClick={() => openResetModal(student)}
                          className="btn btn-outline"
                          style={{ padding: "0.35rem", borderRadius: "8px", minWidth: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}
                          title="Reset Password"
                        >
                          <KeyRound size={14} style={{ color: "#F59E0B" }} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(student)}
                          className="btn btn-outline"
                          style={{ padding: "0.35rem", borderRadius: "8px", minWidth: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(220, 38, 38, 0.2)" }}
                          title="Delete Record"
                        >
                          <Trash2 size={14} style={{ color: "var(--danger)" }} />
                        </button>
                      </div>
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

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            width: "100%",
            maxWidth: "500px",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            padding: "2rem",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "var(--primary)", fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800 }}>Edit Student Record</h3>
              <button 
                onClick={() => { setShowEditModal(false); setSelectedStudent(null); }}
                style={{ border: "none", background: "none", cursor: "pointer", opacity: 0.6, padding: "0.25rem", display: "flex" }}
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="badge badge-danger" style={{ padding: "0.75rem", borderRadius: "var(--radius)", textTransform: "none", fontSize: "0.85rem", width: "100%" }}>
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div className="badge badge-success" style={{ padding: "0.75rem", borderRadius: "var(--radius)", textTransform: "none", fontSize: "0.85rem", width: "100%" }}>
                {actionSuccess}
              </div>
            )}

            <form onSubmit={handleEditStudent} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="label">Index Number (Read Only)</label>
                <input
                  type="text"
                  className="input"
                  value={selectedStudent.index_number}
                  disabled
                  style={{ backgroundColor: "var(--background)", cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Institutional Email</label>
                <input
                  type="email"
                  className="input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Programme</label>
                <input
                  type="text"
                  className="input"
                  value={editProgramme}
                  onChange={(e) => setEditProgramme(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Level</label>
                  <select
                    className="input"
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value)}
                    required
                    style={{ cursor: "pointer" }}
                  >
                    <option value="100">Level 100</option>
                    <option value="200">Level 200</option>
                    <option value="300">Level 300</option>
                    <option value="400">Level 400</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Faculty</label>
                  <select
                    className="input"
                    value={editFaculty}
                    onChange={(e) => setEditFaculty(e.target.value)}
                    required
                    style={{ cursor: "pointer" }}
                  >
                    <option value="Faculty of Applied Sciences and Technology">Applied Sciences & Technology</option>
                    <option value="Faculty of Engineering">Engineering</option>
                    <option value="Faculty of Art and Design">Art and Design</option>
                    <option value="Faculty of Business and Management Studies">Business & Management Studies</option>
                    <option value="Faculty of Applied Social Sciences">Applied Social Sciences</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedStudent(null); }}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "0.6rem" }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "0.6rem" }}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Modal */}
      {showDeleteModal && selectedStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            width: "100%",
            maxWidth: "460px",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            padding: "2rem",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => { setShowDeleteModal(false); setSelectedStudent(null); }}
                style={{ border: "none", background: "none", cursor: "pointer", opacity: 0.6, padding: "0.25rem", display: "flex" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "var(--danger-bg)",
              color: "var(--danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto"
            }}>
              <AlertCircle size={28} />
            </div>

            <div>
              <h3 style={{ margin: "0 0 0.5rem", color: "var(--danger)", fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800 }}>Delete Student Record?</h3>
              <p style={{ fontSize: "0.9rem", opacity: 0.7, lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to remove <strong>{selectedStudent.full_name}</strong> ({selectedStudent.index_number})?
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--danger)", fontWeight: 600, marginTop: "0.5rem", lineHeight: 1.4 }}>
                Warning: If this student has registered their portal account, this action will delete their login credentials and student profile as well. This is irreversible.
              </p>
            </div>

            {actionError && (
              <div className="badge badge-danger" style={{ padding: "0.75rem", borderRadius: "var(--radius)", textTransform: "none", fontSize: "0.85rem", width: "100%" }}>
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div className="badge badge-success" style={{ padding: "0.75rem", borderRadius: "var(--radius)", textTransform: "none", fontSize: "0.85rem", width: "100%" }}>
                {actionSuccess}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setSelectedStudent(null); }}
                className="btn btn-outline"
                style={{ flex: 1, padding: "0.6rem" }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                className="btn btn-danger"
                style={{ flex: 1, padding: "0.6rem" }}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Yes, Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            width: "100%",
            maxWidth: "460px",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            padding: "2rem",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "var(--primary)", fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 800 }}>Reset Password</h3>
              <button 
                onClick={() => { setShowResetModal(false); setSelectedStudent(null); }}
                style={{ border: "none", background: "none", cursor: "pointer", opacity: 0.6, padding: "0.25rem", display: "flex" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: "0.85rem", opacity: 0.7, lineHeight: 1.4 }}>
              Set a new login password for <strong>{selectedStudent.full_name}</strong> ({selectedStudent.email}).
            </div>

            {actionError && (
              <div className="badge badge-danger" style={{ padding: "0.75rem", borderRadius: "var(--radius)", textTransform: "none", fontSize: "0.85rem", width: "100%" }}>
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div className="badge badge-success" style={{ padding: "0.75rem", borderRadius: "var(--radius)", textTransform: "none", fontSize: "0.85rem", width: "100%" }}>
                {actionSuccess}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>New Password</span>
                  <button 
                    type="button" 
                    onClick={generateRandomPassword}
                    style={{ border: "none", background: "none", color: "var(--primary)", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", padding: 0 }}
                  >
                    Generate Random
                  </button>
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  className="input"
                  placeholder="Min 6 characters"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Confirm New Password</label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  className="input"
                  placeholder="Re-enter password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input 
                  type="checkbox" 
                  id="showPasswordCheck" 
                  checked={showPasswordText}
                  onChange={(e) => setShowPasswordText(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <label htmlFor="showPasswordCheck" style={{ fontSize: "0.8rem", opacity: 0.8, cursor: "pointer" }}>Show password text</label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => { setShowResetModal(false); setSelectedStudent(null); }}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "0.6rem" }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "0.6rem" }}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
