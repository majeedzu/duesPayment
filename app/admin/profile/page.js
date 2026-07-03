"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Save, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { getClientSession } from "@/lib/session";

export default function AdminProfile() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const userSession = getClientSession();
    if (!userSession || (userSession.role !== "dept_admin" && userSession.role !== "super_admin")) {
      router.push("/auth/login");
      return;
    }
    setSession(userSession);

    // Fetch current WhatsApp number
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/profile");
      const result = await res.json();
      if (res.ok && result.data && result.data.profile) {
        setWhatsappNumber(result.data.profile.whatsapp || "");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: whatsappNumber })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      setSaveSuccess("WhatsApp number updated successfully!");
      setTimeout(() => setSaveSuccess(""), 3000);
    } catch (err) {
      setSaveError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <Loader2 className="spinner" />
        <span style={{ fontWeight: 600 }}>Loading Profile...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 1rem" }}>
      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 140, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <User size={28} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.5rem", color: "var(--primary)", margin: 0, fontFamily: "var(--font-heading)" }}>
              Profile Settings
            </h2>
            <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.25rem" }}>
              Update your contact information for student support
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--foreground)" }}>
              <Phone size={16} style={{ color: "var(--primary)" }} />
              WhatsApp Number
            </label>
            <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.75rem", lineHeight: 1.5 }}>
              Provide your WhatsApp number so students can easily reach you for help with dues payments. Include country code (e.g., +233244123456)
            </p>
            <input
              type="tel"
              placeholder="+233244123456"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              style={{
                width: "100%",
                height: "48px",
                padding: "0 1rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--background-card)",
                fontSize: "0.95rem",
                color: "var(--foreground)",
                outline: "none"
              }}
            />
            <p style={{ fontSize: "0.7rem", opacity: 0.5, marginTop: "0.5rem", fontStyle: "italic" }}>
              This number will appear in the student help panel for instant WhatsApp chat and phone calls.
            </p>
          </div>

          {saveError && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "1rem",
              borderRadius: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#EF4444",
              fontSize: "0.85rem"
            }}>
              <AlertTriangle size={16} />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "1rem",
              borderRadius: "8px",
              backgroundColor: "rgba(5, 150, 105, 0.1)",
              border: "1px solid rgba(5, 150, 105, 0.3)",
              color: "#059669",
              fontSize: "0.85rem"
            }}>
              <CheckCircle2 size={16} />
              <span>{saveSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.95rem"
            }}
          >
            {saving ? (
              <><Loader2 className="spinner" style={{ width: 18, height: 18 }} /> Saving...</>
            ) : (
              <><Save size={18} /> Save Changes</>
            )}
          </button>
        </form>

        <div style={{
          marginTop: "2rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--border)"
        }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--primary)" }}>
            How Students See Your Contact
          </h3>
          <p style={{ fontSize: "0.8rem", opacity: 0.7, lineHeight: 1.6 }}>
            When students click the floating help button on their dashboard, they will see your name and have options to:
          </p>
          <ul style={{ fontSize: "0.8rem", opacity: 0.7, lineHeight: 1.8, marginTop: "0.75rem", paddingLeft: "1.5rem" }}>
            <li><strong style={{ color: "var(--primary)" }}>WhatsApp you directly</strong> — Opens WhatsApp with pre-filled message</li>
            <li><strong style={{ color: "var(--primary)" }}>Call you</strong> — Initiates phone call to your number</li>
          </ul>
          <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "1rem", fontStyle: "italic" }}>
            Note: If no WhatsApp number is provided, students will only see your email address.
          </p>
        </div>
      </div>
    </div>
  );
}
