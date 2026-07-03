"use client";

import { useState, useEffect } from "react";
import { Upload, Download, BookOpen, Check, ShieldAlert, Loader2, AlertTriangle, RefreshCw, SkipForward, X, AlertOctagon } from "lucide-react";
import Papa from "papaparse";

export default function AdminImportPage() {
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ingestion states
  const [importing, setImporting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Duplicate detection state
  const [pendingRows, setPendingRows] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingRowErrors, setPendingRowErrors] = useState([]);

  // Faculty mismatch state
  const [showFacultyWarning, setShowFacultyWarning] = useState(false);
  const [mismatchedFaculties, setMismatchedFaculties] = useState([]);
  const [pendingValidRows, setPendingValidRows] = useState(null);

  const fetchDepartmentInfo = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setDepartment(data.data.department);
      }
    } catch (err) {
      console.error("Failed to load department details for CSV upload:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { (async () => { await fetchDepartmentInfo(); })(); }, []);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processCSV(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => { if (e.target.files?.[0]) processCSV(e.target.files[0]); };

  // ── Step 1: Parse, validate, faculty-check, then duplicate-check ──────────
  const processCSV = (file) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setImportErrors(["Invalid file format. Please upload a standard CSV file."]);
      return;
    }
    setChecking(true);
    setImportErrors([]);
    setImportSuccess(null);
    setPendingRows(null);
    setDuplicates([]);
    setMismatchedFaculties([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: async (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          setImportErrors(["The uploaded CSV file is empty."]);
          setChecking(false); return;
        }
        const requiredHeaders = ["index_number", "full_name", "email", "programme", "level", "faculty"];
        const missingHeaders = requiredHeaders.filter(h => !(h in rows[0]));
        if (missingHeaders.length > 0) {
          setImportErrors([
            `Missing required CSV column headers: ${missingHeaders.join(", ")}`,
            "Please download the official template below to verify headers."
          ]);
          setChecking(false); return;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@htu\.edu\.gh$/;
        const rowErrors = [];
        const valid = [];
        rows.forEach((student, i) => {
          const missing = requiredHeaders.filter(f => !student[f] || !String(student[f]).trim());
          if (missing.length > 0) { rowErrors.push(`Row ${i + 1}: Missing fields: ${missing.join(", ")}`); return; }
          if (!emailRegex.test(String(student.email).toLowerCase())) {
            rowErrors.push(`Row ${i + 1}: Invalid email: ${student.email}`); return;
          }
          valid.push(student);
        });
        if (valid.length === 0) {
          setImportErrors(["No valid records to import.", ...rowErrors]);
          setChecking(false); return;
        }

        // ── Faculty mismatch check ──────────────────────────────────────────
        if (department?.faculty) {
          const normalize = (s) => String(s || "").toLowerCase().trim();
          const deptFaculty = normalize(department.faculty);
          const wrongFaculties = [...new Set(
            valid
              .map(s => String(s.faculty || "").trim())
              .filter(f => normalize(f) !== deptFaculty && f !== "")
          )];
          if (wrongFaculties.length > 0) {
            setPendingValidRows(valid);
            setPendingRowErrors(rowErrors);
            setMismatchedFaculties(wrongFaculties);
            setShowFacultyWarning(true);
            setChecking(false); return;
          }
        }

        await checkDuplicates(valid, rowErrors);
      },
      error: (err) => {
        setImportErrors([`Failed to parse CSV file: ${err.message}`]);
        setChecking(false);
      }
    });
  };

  // ── Step 2: Check duplicates ───────────────────────────────────────────────
  const checkDuplicates = async (valid, rowErrors) => {
    setChecking(true);
    try {
      const indexNumbers = valid.map(s => String(s.index_number).trim());
      const res = await fetch("/api/csv/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indexNumbers })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Duplicate check failed");
      setPendingRows(valid);
      setPendingRowErrors(rowErrors);
      if (result.duplicateCount > 0) {
        setDuplicates(result.duplicates);
        setShowDuplicateModal(true);
        if (rowErrors.length > 0) setImportErrors(rowErrors);
      } else {
        if (rowErrors.length > 0) setImportErrors(rowErrors);
        await runImport(valid, false);
      }
    } catch (err) {
      setImportErrors([`Duplicate check failed: ${err.message}`]);
    } finally {
      setChecking(false);
    }
  };

  // ── Step 3: Perform the actual import ─────────────────────────────────────
  const runImport = async (rows, skipDuplicates) => {
    setImporting(true);
    setShowDuplicateModal(false);
    try {
      const res = await fetch("/api/csv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: rows, departmentId: department?.id, skipDuplicates })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setImportSuccess(
          `Import complete! ${result.imported} new student(s) added. ` +
          `${result.updated || 0} existing record(s) updated. ` +
          `${result.skippedDuplicates || 0} duplicate(s) skipped. ` +
          `${result.manualPayments} cash payment(s) recorded.`
        );
        if (result.errors?.length > 0) setImportErrors(prev => [...prev, ...result.errors]);
      } else {
        setImportErrors(prev => [...prev, result.message || "Failed to process student uploads."]);
      }
    } catch (err) {
      setImportErrors(prev => [...prev, "Connection to API failed. Try again."]);
    } finally {
      setImporting(false);
      setPendingRows(null);
      setDuplicates([]);
    }
  };

  // Faculty warning handlers
  const handleFacultyProceed = async () => {
    setShowFacultyWarning(false);
    await checkDuplicates(pendingValidRows, pendingRowErrors);
    setPendingValidRows(null);
  };
  const handleFacultyCancel = () => {
    setShowFacultyWarning(false);
    setPendingValidRows(null);
    setPendingRowErrors([]);
    setMismatchedFaculties([]);
  };

  // Duplicate modal handlers
  const handleUpdateDuplicates = () => runImport(pendingRows, false);
  const handleSkipDuplicates   = () => runImport(pendingRows, true);
  const handleCancelImport     = () => {
    setShowDuplicateModal(false);
    setPendingRows(null);
    setDuplicates([]);
  };

  const handleDownloadTemplate = () => {
    const deptFaculty = department?.faculty || "Faculty of Applied Sciences and Technology";
    const deptName = department?.name || "Your Department";
    const csvContent = [
      ["index_number", "full_name", "email", "programme", "level", "faculty", "paid_status"],
      ["0322080456", "John Doe", "0322080456@htu.edu.gh", `BTech ${deptName}`, "400", deptFaculty, ""],
      ["0322080999", "Jane Smith", "0322080999@htu.edu.gh", `BTech ${deptName}`, "300", deptFaculty, "paid"]
    ].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const safeName = deptName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    link.setAttribute("download", `htu_${safeName}_import_template.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const isBusy = checking || importing;

  if (loading) {
    return (
      <div style={{ display: "flex", height: "300px", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="spinner" />
      </div>
    );
  }

  // ── Shared modal overlay style ─────────────────────────────────────────────
  const overlayStyle = {
    position: "fixed", inset: 0, zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1rem"
  };

  // Fully opaque card background — never inherits transparency from overlay
  const modalCardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    width: "100%",
    boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
    overflow: "hidden"
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>

      {/* ── FACULTY MISMATCH WARNING ───────────────────────────────────────── */}
      {showFacultyWarning && (
        <div style={overlayStyle}>
          <div style={{ ...modalCardStyle, maxWidth: "520px" }}>
            {/* Red warning header banner */}
            <div style={{
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              padding: "1.5rem",
              display: "flex", alignItems: "center", gap: "0.85rem"
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <AlertOctagon size={26} color="white" />
              </div>
              <div>
                <h3 style={{ color: "white", margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                  Wrong Faculty Detected
                </h3>
                <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  This CSV does not belong to your department
                </p>
              </div>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Expected vs found */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem"
              }}>
                <div style={{
                  padding: "0.85rem 1rem", borderRadius: "10px",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #86efac"
                }}>
                  <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#16a34a", marginBottom: "0.35rem" }}>
                    Your Department
                  </p>
                  <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a", lineHeight: 1.3 }}>
                    {department?.name}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.2rem", lineHeight: 1.3 }}>
                    {department?.faculty}
                  </p>
                </div>
                <div style={{
                  padding: "0.85rem 1rem", borderRadius: "10px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fca5a5"
                }}>
                  <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#dc2626", marginBottom: "0.35rem" }}>
                    Found in CSV
                  </p>
                  {mismatchedFaculties.map((f, i) => (
                    <p key={i} style={{ fontWeight: 700, fontSize: "0.85rem", color: "#dc2626", lineHeight: 1.3 }}>{f}</p>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.6, margin: 0 }}>
                Uploading this file will add students from a <strong>different faculty</strong> into your department roster. This is likely a mistake. Are you sure you want to continue?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  onClick={handleFacultyCancel}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "0.75rem", gap: "0.5rem" }}
                >
                  <X size={16} /> Cancel — Upload the Correct CSV
                </button>
                <button
                  onClick={handleFacultyProceed}
                  style={{
                    width: "100%", padding: "0.65rem", borderRadius: "var(--radius)",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(220,38,38,0.35)",
                    color: "#dc2626", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                  }}
                >
                  <AlertTriangle size={14} /> I understand — proceed anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DUPLICATE CONFIRMATION MODAL ──────────────────────────────────── */}
      {showDuplicateModal && (
        <div style={overlayStyle}>
          <div style={{
            backgroundColor: "#ffffff", color: "#0f172a", borderRadius: "16px",
            width: "100%", maxWidth: "580px",
            boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
            overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            {/* Amber header banner */}
            <div style={{
              background: "linear-gradient(135deg, #d97706, #b45309)",
              padding: "1.25rem 1.5rem",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <AlertTriangle size={22} color="white" />
                </div>
                <div>
                  <h3 style={{ color: "white", margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                    {duplicates.length} Duplicate Record{duplicates.length !== 1 ? "s" : ""} Found
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.78rem", marginTop: "0.15rem" }}>
                    These students already exist in the database
                  </p>
                </div>
              </div>
              <button onClick={handleCancelImport}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer",
                  borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center",
                  justifyContent: "center", color: "white", flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            {/* Duplicate table */}
            <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{
                border: "2px solid rgba(217,119,6,0.3)", borderRadius: "10px", overflow: "hidden"
              }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "1.1fr 1.5fr 1.3fr",
                  backgroundColor: "rgba(217,119,6,0.12)",
                  padding: "0.55rem 0.85rem",
                  fontWeight: 800, fontSize: "0.72rem",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  color: "#92400e", gap: "0.5rem"
                }}>
                  <span>Index No.</span>
                  <span>Name</span>
                  <span>Programme</span>
                </div>
                {duplicates.map((s, i) => (
                  <div key={s.index_number} style={{
                    display: "grid", gridTemplateColumns: "1.1fr 1.5fr 1.3fr",
                    padding: "0.6rem 0.85rem", gap: "0.5rem",
                    borderTop: "1px solid rgba(217,119,6,0.15)",
                    backgroundColor: i % 2 === 0 ? "rgba(217,119,6,0.03)" : "transparent",
                    fontSize: "0.8rem", alignItems: "center"
                  }}>
                    <span style={{ fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
                      {s.index_number}
                    </span>
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1e293b" }}>
                      {s.full_name}
                    </span>
                    <span style={{ color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.programme}
                    </span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: "0.82rem", color: "#374151", margin: 0 }}>
                How would you like to handle these <strong>{duplicates.length}</strong> existing record{duplicates.length !== 1 ? "s" : ""}?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                <button className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", gap: "0.5rem", padding: "0.75rem" }}
                  onClick={handleUpdateDuplicates}>
                  <RefreshCw size={15} /> Update existing records with new CSV data
                </button>
                <button className="btn btn-outline"
                  style={{ width: "100%", justifyContent: "center", gap: "0.5rem", padding: "0.75rem" }}
                  onClick={handleSkipDuplicates}>
                  <SkipForward size={15} /> Skip duplicates — only add new students
                </button>
                <button
                  style={{
                    width: "100%", padding: "0.7rem", borderRadius: "var(--radius)",
                    backgroundColor: "transparent", border: "1px solid rgba(239,68,68,0.3)",
                    color: "var(--danger)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                  }}
                  onClick={handleCancelImport}>
                  <X size={15} /> Cancel import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV IMPORT PANEL ───────────────────────────────────────────────── */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ color: "var(--primary)", fontFamily: "var(--font-heading)" }}>Upload Student Roster</h3>
            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>Import students to the database using a <code>.csv</code> file format.</p>
          </div>
          <button onClick={handleDownloadTemplate} className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
            <Download size={14} /> Template
          </button>
        </div>

        <div
          className={`upload-zone ${dragActive ? "active" : ""}`}
          onDragEnter={handleDrag} onDragOver={handleDrag}
          onDragLeave={handleDrag} onDrop={handleDrop}
          onClick={() => !isBusy && document.getElementById("csv-file-input").click()}
          style={{ cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.7 : 1 }}
        >
          <input type="file" id="csv-file-input" accept=".csv"
            style={{ display: "none" }} onChange={handleFileChange} disabled={isBusy} />
          {isBusy ? (
            <Loader2 className="spinner" style={{ width: 32, height: 32 }} />
          ) : (
            <Upload size={32} style={{ color: "var(--primary)", opacity: 0.7 }} />
          )}
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              {checking ? "Checking for issues..." : importing ? "Importing records..." : "Drag and drop your CSV here"}
            </p>
            <p style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem" }}>
              {isBusy ? "Please wait…" : "or click to browse from computer"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "rgba(var(--primary-rgb), 0.04)", borderRadius: "var(--radius)", fontSize: "0.75rem" }}>
          <BookOpen size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ color: "var(--primary)" }}>Required Columns:</strong>
            <p style={{ opacity: 0.8, marginTop: "0.25rem", fontStyle: "italic" }}>index_number, full_name, email, programme, level, faculty</p>
            <p style={{ opacity: 0.8, marginTop: "0.25rem", fontStyle: "italic" }}>
              <strong>Optional:</strong> paid_status (set to <code>paid</code> to record a manual cash payment)
            </p>
            <p style={{ opacity: 0.6, marginTop: "0.25rem" }}>Emails must end with <code>@htu.edu.gh</code> to be accepted.</p>
          </div>
        </div>

        {importSuccess && (
          <div className="badge badge-success" style={{ padding: "0.75rem 1rem", width: "100%", borderRadius: "var(--radius)", textTransform: "none", display: "flex", gap: "0.5rem", fontSize: "0.8rem", fontWeight: 500 }}>
            <Check size={16} /> {importSuccess}
          </div>
        )}

        {importErrors.length > 0 && (
          <div style={{ backgroundColor: "var(--danger-bg)", border: "1px solid rgba(239,68,68,0.2)", padding: "1rem", borderRadius: "var(--radius)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
    </div>
  );
}
