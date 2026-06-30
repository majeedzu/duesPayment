"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Check,
  X,
  Upload,
  ArrowRight,
  FileText,
  TrendingUp
} from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    paidCount: 0,
    unpaidCount: 0,
    totalRevenue: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [department, setDepartment] = useState(null);

  // Broadcast notification states
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState("");
  const [notifError, setNotifError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.data.stats);
          setDepartment(data.data.department);
          setRecentPayments((data.data.payments || []).filter(p => p.status === "success").slice(0, 4));
        }
      }
    } catch (error) {
      console.error("Failed to load admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setSendingNotif(true);
    setNotifSuccess("");
    setNotifError("");

    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notifTitle, message: notifMessage })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setNotifSuccess("Broadcast notification successfully sent to all department students!");
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

  const paidPercent = stats.totalStudents > 0
    ? Math.round((stats.paidCount / stats.totalStudents) * 100)
    : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", height: "300px", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* Stats Grid */}
      <div className="grid grid-cols-4">
        <div className="card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div>
            <span style={{ fontSize: "0.8rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Students</span>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(0, 55, 114, 0.1)", color: "var(--primary)" }}>
            <Users size={22} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
          <div>
            <span style={{ fontSize: "0.8rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Paid Dues</span>
            <div className="stat-value" style={{ color: "var(--success)" }}>{stats.paidCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
            <Check size={22} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: "4px solid var(--danger)" }}>
          <div>
            <span style={{ fontSize: "0.8rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Unpaid Dues</span>
            <div className="stat-value" style={{ color: "var(--danger)" }}>{stats.unpaidCount}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
            <X size={22} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div>
            <span style={{ fontSize: "0.8rem", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Revenue</span>
            <div className="stat-value" style={{ fontSize: "1.5rem", color: "var(--primary)" }}>GHS {stats.totalRevenue.toFixed(2)}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(var(--primary-rgb), 0.08)", color: "var(--primary)" }}>
            <CreditCard size={22} />
          </div>
        </div>
      </div>

      {/* Payment Progress Bar */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h4 style={{ color: "var(--primary)", margin: 0 }}>Dues Clearance Progress</h4>
            <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.2rem" }}>{stats.paidCount} of {stats.totalStudents} students have cleared dues</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--primary)", fontWeight: 800, fontSize: "1.25rem" }}>
            <TrendingUp size={18} />
            {paidPercent}%
          </div>
        </div>
        <div style={{ height: "10px", borderRadius: "var(--radius-full)", backgroundColor: "var(--border)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${paidPercent}%`,
            borderRadius: "var(--radius-full)",
            background: `linear-gradient(90deg, var(--primary), var(--dashboard-accent))`,
            transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)"
          }} />
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-3" style={{ gap: "1.25rem" }}>
        <Link href="/admin/roster" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer", transition: "var(--transition)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "3px solid var(--primary)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", backgroundColor: "rgba(var(--primary-rgb), 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <Users size={20} />
              </div>
              <ArrowRight size={18} style={{ opacity: 0.4 }} />
            </div>
            <div>
              <h4 style={{ color: "var(--primary)", margin: 0 }}>Student Roster</h4>
              <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.25rem" }}>View and search all enrolled students and their dues status.</p>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700 }}>{stats.totalStudents} students enrolled →</span>
          </div>
        </Link>

        <Link href="/admin/import" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer", transition: "var(--transition)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "3px solid var(--dashboard-accent)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", backgroundColor: "rgba(56, 189, 248, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dashboard-accent)" }}>
                <Upload size={20} />
              </div>
              <ArrowRight size={18} style={{ opacity: 0.4 }} />
            </div>
            <div>
              <h4 style={{ color: "var(--primary)", margin: 0 }}>CSV Upload</h4>
              <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.25rem" }}>Import a student list or update payment records using a CSV file.</p>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--dashboard-accent)", fontWeight: 700 }}>Upload a new roster →</span>
          </div>
        </Link>

        <Link href="/admin/transactions" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer", transition: "var(--transition)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "3px solid var(--success)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", backgroundColor: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success)" }}>
                <FileText size={20} />
              </div>
              <ArrowRight size={18} style={{ opacity: 0.4 }} />
            </div>
            <div>
              <h4 style={{ color: "var(--primary)", margin: 0 }}>Transactions</h4>
              <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: "0.25rem" }}>Monitor live payments, verify receipts, and review clearance logs.</p>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 700 }}>View all transactions →</span>
          </div>
        </Link>
      </div>

      {/* Broadcast Notification to Students */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", margin: "0 0 0.5rem 0" }}>Broadcast Notification to Students</h3>
        <p style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "1.25rem" }}>Send a dashboard alert to all students enrolled in the {department?.name || 'department'}.</p>
        
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

        <form onSubmit={handleSendNotification} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.7 }}>Notification Title</label>
            <input 
              type="text" 
              placeholder="e.g. Dues Payment Deadline Extended" 
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.7 }}>Notification Message</label>
            <textarea 
              placeholder="Write your broadcast message here..." 
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              required
              rows={4}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
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
            style={{ alignSelf: "flex-end", padding: "0.6rem 1.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}
            disabled={sendingNotif}
          >
            {sendingNotif ? 'Sending...' : 'Broadcast Alert'}
          </button>
        </form>
      </div>

      {/* Recent Payments Quick View */}
      {recentPayments.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)", margin: 0 }}>Recent Clearances</h3>
            <Link href="/admin/transactions" style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700, textDecoration: "underline" }}>
              View all
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {recentPayments.map((pay, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", backgroundColor: "rgba(var(--primary-rgb), 0.01)" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Index: {pay.student_index_number}</span>
                  <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "0.15rem", fontFamily: "monospace" }}>{pay.paystack_reference}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontWeight: 800, color: "var(--primary)" }}>GHS {parseFloat(pay.amount).toFixed(2)}</span>
                  <span className="badge badge-success" style={{ fontSize: "0.65rem" }}>Cleared</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
