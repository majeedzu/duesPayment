"use client";

import { useState, useEffect } from "react";
import { Upload, Download, BookOpen, Check, ShieldAlert, Loader2 } from "lucide-react";
import Papa from "papaparse";

export default function AdminImportPage() {
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ingestion states
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
      dynamicTyping: false,  // Keep all values as strings — prevents leading zeros being stripped from index numbers
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
        const missingHeaders = requiredHeaders.filter(header => !(header in firstRow));

        if (missingHeaders.length > 0) {
          setImportErrors([
            `Missing required CSV column headers: ${missingHeaders.join(", ")}`,
            "Please download the official template below to verify headers."
          ]);
          setImporting(false);
          return;
        }

        // Process rows in batches or send entire collection to backend API
        try {
          const res = await fetch("/api/csv/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              students: rows,
              departmentId: department?.id
            })
          });

          const result = await res.json();
          if (res.ok && result.success) {
            setImportSuccess(
              `Import complete! Enrolled: ${result.imported} students. Cash payments verified: ${result.manualPayments} records.`
            );
            if (result.errors && result.errors.length > 0) {
              setImportErrors(result.errors);
            }
          } else {
            setImportErrors([result.message || "Failed to process student uploads."]);
          }
        } catch (err) {
          setImportErrors(["Connection to API failed. Try again."]);
        } finally {
          setImporting(false);
        }
      },
      error: (err) => {
        setImportErrors([`Failed to parse CSV file: ${err.message}`]);
        setImporting(false);
      }
    });
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

  if (loading) {
    return (
      <div style={{ display: "flex", height: "300px", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* CSV Import Panel */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
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
          {importing ? (
            <Loader2 className="spinner" style={{ width: 32, height: 32 }} />
          ) : (
            <Upload size={32} style={{ color: "var(--primary)", opacity: 0.7 }} />
          )}
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
    </div>
  );
}
