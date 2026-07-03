"use client";

import { useState, useEffect } from "react";
import { Upload, Download, BookOpen, Check, ShieldAlert, Loader2, AlertTriangle, RefreshCw, SkipForward, X } from "lucide-react";
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
  const [pendingRows, setPendingRows] = useState(null);       // valid rows parsed from CSV
  const [duplicates, setDuplicates] = useState([]);           // existing student records that clash
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const fetchDepartmentInfo = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDepartment(data.data.department);
        }
      }
    } catch (err) {
      console.error("Failed to load department details for CSV upload:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => { await fetchDepartmentInfo(); })();
  }, []);

  // ── Drag & drop handlers ────────────────────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processCSV(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) processCSV(e.target.files[0]);
  };

  // ── Step 1: Parse + validate CSV, then check for duplicates ────────────────
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

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: async (results) => {
        const rows = results.data;

        if (rows.length === 0) {
          setImportErrors(["The uploaded CSV file is empty."]);
          setChecking(false);
          return;
        }

        // Validate required headers
        const requiredHeaders = ["index_number", "full_name", "email", "programme", "level", "faculty"];
        const missingHeaders = requiredHeaders.filter(h => !(h in rows[0]));
        if (missingHeaders.length > 0) {
          setImportErrors([
            `Missing required CSV column headers: ${missingHeaders.join(", ")}`,
            "Please download the official template below to verify headers."
          ]);
          setChecking(false);
          return;
        }

        // Validate rows
        const emailRegex = /^[a-zA-Z0-9._%+-]+@htu\.edu\.gh$/;
        const rowErrors = [];
        const valid = [];

        rows.forEach((student, i) => {
          const required = ["index_number", "full_name", "email", "programme", "level", "faculty"];
          const missing = required.filter(f => !student[f] || !String(student[f]).trim());
          if (missing.length > 0) {
            rowErrors.push(`Row ${i + 1}: Missing fields: ${missing.join(", ")}`);
            return;
          }
          if (!emailRegex.test(String(student.email).toLowerCase())) {
            rowErrors.push(`Row ${i + 1}: Invalid email format: ${student.email}`);
            return;
          }
          valid.push(student);
        });

        if (valid.length === 0) {
          setImportErrors(["No valid records to import.", ...rowErrors]);
          setChecking(false);
          return;
        }

        // Check for duplicates before committing
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

          if (result.duplicateCount > 0) {
            setDuplicates(result.duplicates);
            setShowDuplicateModal(true);
            if (rowErrors.length > 0) setImportErrors(rowErrors);
          } else {
            // No duplicates — proceed directly
            if (rowErrors.length > 0) setImportErrors(rowErrors);
            await runImport(valid, false);
          }
        } catch (err) {
          setImportErrors([`Duplicate check failed: ${err.message}`]);
        } finally {
          setChecking(false);
        }
      },
      error: (err) => {
        setImportErrors([`Failed to parse CSV file: ${err.message}`]);
        setChecking(false);
      }
    });
  };

  // ── Step 2: Perform the actual import ──────────────────────────────────────
  const runImport = async (rows, skipDuplicates) => {
    setImporting(true);
    setShowDuplicateModal(false);

    try {
      const res = await fetch("/api/csv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: rows,
          departmentId: department?.id,
          skipDuplicates
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setImportSuccess(
          `Import complete! ${result.imported} new student(s) added. ` +
          `${result.updated || 0} existing record(s) updated. ` +
          `${result.skippedDuplicates || 0} duplicate(s) skipped. ` +
          `${result.manualPayments} cash payment(s) recorded.`
        );
        if (result.errors && result.errors.length > 0) {
          setImportErrors(prev => [...prev, ...result.errors]);
        }
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

  const handleUpdateDuplicates = () => runImport(pendingRows, false);
  const handleSkipDuplicates  = () => runImport(pendingRows, true);
  const handleCancelImport    = () => {
    setShowDuplicateModal(false);
    setPendingRows(null);
    setDuplicates([]);
  };

  // ── Template download ──────────────────────────────────────────────────────
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
    link.setAttribute("download", "htu_student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isBusy = checking || importing;

  if (loading) {
    return (
      <div style={{ display: "flex", height: "300px", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>

      {/* ── Duplicate Confirmation Modal ───────────────────────────────────── */}
      {showDuplicateModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            width: "100%", maxWidth: "560px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", gap: "1.25rem",
            padding: "1.5rem",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  backgroundColor: "rgba(234,179,8,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <AlertTriangle size={18} style={{ color: "#ca8a04" }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontFamily: "var(--font-heading)" }}>
                    Duplicate Records Found
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6, marginTop: "0.15rem" }}>
                    {duplicates.length} student{duplicates.length !== 1 ? "s" : ""} in this CSV already exist in the database
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelImport}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--foreground)", opacity: 0.5 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Duplicate list */}
            <div style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
              fontSize: "0.78rem"
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.4fr 1fr",
                backgroundColor: "rgba(var(--primary-rgb),0.06)",
                padding: "0.5rem 0.75rem",
                fontWeight: 700,
                opacity: 0.8,
                gap: "0.5rem"
              }}>
                <span>Index No.</span>
                <span>Name</span>
                <span>Programme</span>
              </div>
              {duplicates.map((s, i) => (
                <div key={s.index_number} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.4fr 1fr",
                  padding: "0.55rem 0.75rem",
                  gap: "0.5rem",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  backgroundColor: i % 2 === 0 ? "transparent" : "rgba(var(--primary-rgb),0.02)"
                }}>
                  <span style={{ fontWeight: 600, color: "var(--primary)", fontFamily: "monospace", fontSize: "0.75rem" }}>
                    {s.index_number}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.full_name}
                  </span>
                  <span style={{ opacity: 0.65, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.programme}
                  </span>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <p style={{ fontSize: "0.78rem", opacity: 0.7, margin: 0 }}>
              How would you like to handle these {duplicates.length} existing record{duplicates.length !== 1 ? "s" : ""}?
            </p>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "center", gap: "0.5rem", padding: "0.7rem" }}
                onClick={handleUpdateDuplicates}
              >
                <RefreshCw size={15} />
                Update existing records with new CSV data
              </button>
              <button
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center", gap: "0.5rem", padding: "0.7rem" }}
                onClick={handleSkipDuplicates}
              >
                <SkipForward size={15} />
                Skip duplicates, only add new students
              </button>
              <button
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center", gap: "0.5rem", padding: "0.7rem", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}
                onClick={handleCancelImport}
              >
                <X size={15} />
                Cancel import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV Import Panel ───────────────────────────────────────────────── */}
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

        {/* Upload Zone */}
        <div
          className={`upload-zone ${dragActive ? "active" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isBusy && document.getElementById("csv-file-input").click()}
          style={{ cursor: isBusy ? "not-allowed" : "pointer", opacity: isBusy ? 0.7 : 1 }}
        >
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={isBusy}
          />
          {isBusy ? (
            <Loader2 className="spinner" style={{ width: 32, height: 32 }} />
          ) : (
            <Upload size={32} style={{ color: "var(--primary)", opacity: 0.7 }} />
          )}
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              {checking  ? "Checking for duplicates..." :
               importing ? "Importing records..." :
               "Drag and drop your CSV here"}
            </p>
            <p style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "0.25rem" }}>
              {isBusy ? "Please wait…" : "or click to browse from computer"}
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

        {/* Success message */}
        {importSuccess && (
          <div className="badge badge-success" style={{ padding: "0.75rem 1rem", width: "100%", borderRadius: "var(--radius)", textTransform: "none", display: "flex", gap: "0.5rem", fontSize: "0.8rem", fontWeight: 500 }}>
            <Check size={16} /> {importSuccess}
          </div>
        )}

        {/* Errors / warnings */}
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
    </div>
  );
}
