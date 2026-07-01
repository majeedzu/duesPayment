"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, FileText, Loader2, Calendar, RefreshCw, Filter } from "lucide-react";

export default function AdminTransactionsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPayments(data.data.payments || []);
        }
      }
    } catch (err) {
      console.error("Failed to load payment logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchPayments(); })();
   
  }, []);

  // Search & Filtering
  const filteredPayments = payments.filter(pay => {
    const matchesSearch = 
      pay.student_index_number.includes(search) ||
      pay.paystack_reference.toLowerCase().includes(search.toLowerCase()) ||
      (pay.receipt_id && pay.receipt_id.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter === "success") return matchesSearch && pay.status === "success";
    if (statusFilter === "pending") return matchesSearch && pay.status === "pending";
    if (statusFilter === "failed") return matchesSearch && pay.status === "failed";
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    Promise.resolve().then(() => setCurrentPage(1));
  }, [search, statusFilter]);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "300px", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="spinner" />
      </div>
    );
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Transactions Ledger</h3>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>Monitor checkout sessions, cash verifications, and active transaction statuses.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            onClick={fetchPayments} 
            className="btn btn-outline" 
            style={{ padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Refresh Logs"
          >
            <RefreshCw size={14} />
          </button>
          <div style={{ backgroundColor: "rgba(0, 0, 140, 0.05)", padding: "0.5rem 1rem", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>Total Revenue Collected</span>
            <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)" }}>
              GHS {payments.filter(p => p.status === "success").reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & search */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
        <div style={{ position: "relative", minWidth: "240px", flex: 1 }}>
          <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={16} />
          <input
            type="text"
            placeholder="Search by index, reference, receipt ID..."
            className="input"
            style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.85rem" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.25rem 0.5rem", backgroundColor: "var(--card-bg)" }}>
          <Filter size={14} style={{ opacity: 0.6 }} />
          <select 
            style={{ border: "none", background: "none", outline: "none", fontSize: "0.85rem", cursor: "pointer", paddingRight: "0.5rem" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", opacity: 0.5 }}>
          <FileText size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
          <p>No transactions match your search/filter criteria.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Index Number</th>
                  <th>Amount</th>
                  <th>Semester</th>
                  <th>Paystack Reference</th>
                  <th>Status</th>
                  <th>Receipt ID</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((pay, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{pay.student_index_number}</td>
                    <td style={{ fontWeight: 800 }}>GHS {parseFloat(pay.amount).toFixed(2)}</td>
                    <td style={{ fontSize: "0.85rem", fontWeight: 600 }}>{pay.semester || "Both Semesters"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", opacity: 0.8 }}>{pay.paystack_reference}</td>
                    <td>
                      <span className={`badge ${pay.status === 'success' ? 'badge-success' : pay.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {pay.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{pay.receipt_id || "N/A"}</td>
                    <td style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      {pay.payment_date ? new Date(pay.payment_date).toLocaleString() : new Date(pay.created_at).toLocaleString()}
                    </td>
                    <td>
                      {pay.receipt_id ? (
                        <Link 
                           href={`/verify/${pay.receipt_id}`} 
                           target="_blank" 
                           className="btn btn-outline"
                           style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", display: "inline-flex", gap: "0.25rem", alignItems: "center" }}
                        >
                          Verify slip <ChevronRight size={12} />
                        </Link>
                      ) : (
                        <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                Page {currentPage} of {totalPages} ({filteredPayments.length} total payments)
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
        </>
      )}
    </div>
  );
}
