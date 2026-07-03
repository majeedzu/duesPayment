"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  CreditCard, Smartphone, ShieldCheck, ArrowLeft, 
  HelpCircle, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [email, setEmail] = useState("");
  
  const [paymentMethod, setPaymentMethod] = useState("momo"); // momo, card
  const [momoProvider, setMomoProvider] = useState("mtn"); // mtn, telecel, airteltigo
  const [phoneNumber, setPhoneNumber] = useState("0244123456");
  const [cardNumber, setCardNumber] = useState("4000 1234 5678 9010");
  
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("pending"); // pending, success, failed

  useEffect(() => {
    const refParam = searchParams.get("reference");
    const amountParam = searchParams.get("amount");
    const emailParam = searchParams.get("email");

    Promise.resolve().then(() => {
      if (refParam) setReference(refParam);
      if (amountParam) setAmount(parseFloat(amountParam).toFixed(2));
      if (emailParam) setEmail(emailParam);
    });
  }, [searchParams]);

  const handleProcessPayment = async (shouldSucceed) => {
    setProcessing(true);
    setStatus("pending");

    // Simulate Paystack transaction processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Direct update payment route
      const res = await fetch("/api/payment/verify-webhook-mock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mock-secret": "htu-mock-dev-secret"
        },
        body: JSON.stringify({
          reference,
          status: shouldSucceed ? "success" : "failed",
          amount: parseFloat(amount)
        })
      });

      if (!res.ok) {
        throw new Error("Simulation update failed.");
      }

      setStatus(shouldSucceed ? "success" : "failed");
    } catch (err) {
      console.error(err);
      setStatus("failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleRedirectBack = () => {
    router.push(`/student/dashboard?reference=${reference}`);
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#E5E7EB", // Neutral gray background to match modal overlay feel
      padding: "1rem"
    }}>
      
      {/* simulated page banner */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#4B5563", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: 600 }}>
        <HelpCircle size={16} />
        <span>PAYSTACK CHECKOUT SIMULATOR (MOCK MODE)</span>
      </div>

      {status === "pending" && !processing && (
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "400px",
          overflow: "hidden",
          border: "1px solid #D1D5DB"
        }}>
          
          {/* Paystack Header */}
          <div style={{ 
            backgroundColor: "#09A5DB", 
            color: "#FFFFFF", 
            padding: "1.5rem", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <div>
              <span style={{ fontSize: "0.75rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pay To</span>
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>HTU FINANCE DIRECTORATE</h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Amount</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>GHS {amount}</h3>
            </div>
          </div>

          {/* User Email Indicator */}
          <div style={{ backgroundColor: "#F3F4F6", padding: "0.5rem 1.5rem", fontSize: "0.8rem", color: "#4B5563", borderBottom: "1px solid #E5E7EB" }}>
            <span>Paying as: <strong>{email}</strong></span>
          </div>

          {/* Checkout Body */}
          <div style={{ padding: "1.5rem" }}>
            
            {/* Pay Methods Selectors */}
            <div style={{ display: "flex", border: "1px solid #E5E7EB", borderRadius: "6px", overflow: "hidden", marginBottom: "1.5rem" }}>
              <button 
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  border: "none",
                  backgroundColor: paymentMethod === "momo" ? "#FFFFFF" : "#F9FAFB",
                  color: paymentMethod === "momo" ? "#000000" : "#9CA3AF",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
                onClick={() => setPaymentMethod("momo")}
              >
                <Smartphone size={16} /> Mobile Money
              </button>
              <button 
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  border: "none",
                  backgroundColor: paymentMethod === "card" ? "#FFFFFF" : "#F9FAFB",
                  color: paymentMethod === "card" ? "#000000" : "#9CA3AF",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard size={16} /> Card
              </button>
            </div>

            {/* Mobile Money Settings */}
            {paymentMethod === "momo" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Network Provider</label>
                  <select 
                    style={{ padding: "0.6rem", border: "1px solid #D1D5DB", borderRadius: "6px", width: "100%", outline: "none" }}
                    value={momoProvider}
                    onChange={(e) => setMomoProvider(e.target.value)}
                  >
                    <option value="mtn">MTN Mobile Money</option>
                    <option value="telecel">Telecel Cash</option>
                    <option value="airteltigo">AT Money</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Mobile Number</label>
                  <input 
                    type="text" 
                    className="input" 
                    style={{ padding: "0.6rem", borderColor: "#D1D5DB" }} 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Card Settings */}
            {paymentMethod === "card" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Card Number</label>
                  <input 
                    type="text" 
                    className="input" 
                    style={{ padding: "0.6rem", borderColor: "#D1D5DB" }} 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Expiry Date</label>
                    <input type="text" className="input" placeholder="MM/YY" style={{ padding: "0.6rem", borderColor: "#D1D5DB", textAlign: "center" }} defaultValue="12/29" />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>CVV</label>
                    <input type="password" className="input" placeholder="123" style={{ padding: "0.6rem", borderColor: "#D1D5DB", textAlign: "center" }} defaultValue="999" />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button 
                onClick={() => handleProcessPayment(true)} 
                style={{
                  flex: 1,
                  backgroundColor: "#3ECF8E",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "0.8rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Pay GHS {amount}
              </button>
              <button 
                onClick={() => handleProcessPayment(false)} 
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "0.8rem 1rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Fail Dues
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", color: "#9CA3AF", fontSize: "0.75rem", marginTop: "1.5rem" }}>
              <ShieldCheck size={14} />
              <span>Secured by Paystack simulator</span>
            </div>

          </div>
        </div>
      )}

      {/* Processing Loader View */}
      {processing && (
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          padding: "3rem 2rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          border: "1px solid #D1D5DB"
        }}>
          <Loader2 className="spinner" style={{ width: "40px", height: "40px", borderTopColor: "#09A5DB" }} />
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1F2937" }}>Processing Transaction</h3>
            <p style={{ fontSize: "0.85rem", color: "#6B7280", marginTop: "0.5rem" }}>
              Simulating payment handshake with network provider...
            </p>
          </div>
        </div>
      )}

      {/* Success View */}
      {status === "success" && !processing && (
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          padding: "3rem 2rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          border: "1px solid #D1D5DB"
        }}>
          <CheckCircle2 size={56} style={{ color: "#3ECF8E" }} />
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1F2937" }}>Payment Successful!</h3>
            <p style={{ fontSize: "0.85rem", color: "#6B7280", marginTop: "0.5rem" }}>
              Transaction ref: <strong>{reference}</strong> has been confirmed.
            </p>
          </div>
          <button onClick={handleRedirectBack} className="btn btn-primary" style={{ width: "100%" }}>
            Return to Dashboard
          </button>
        </div>
      )}

      {/* Failed View */}
      {status === "failed" && !processing && (
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          padding: "3rem 2rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          border: "1px solid #D1D5DB"
        }}>
          <AlertCircle size={56} style={{ color: "#EF4444" }} />
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1F2937" }}>Transaction Failed</h3>
            <p style={{ fontSize: "0.85rem", color: "#6B7280", marginTop: "0.5rem" }}>
              The payment handshake was terminated or declined by the provider.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
            <button onClick={() => setStatus("pending")} className="btn btn-outline" style={{ flex: 1 }}>
              Try Again
            </button>
            <button onClick={handleRedirectBack} className="btn btn-danger" style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#E5E7EB" }}>
        <div className="spinner"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
