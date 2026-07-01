const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export const paystack = {
  isConfigured() {
    return !!paystackSecret;
  },

  async initialize(email, amountGHS, reference) {
    // Paystack processes amounts in minor units (Pesewas for GHS, i.e., GHS * 100)
    const amountInPesewas = Math.round(amountGHS * 100);

    if (this.isConfigured()) {
      try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: amountInPesewas,
            reference,
            callback_url: `${appUrl}/student/dashboard?reference=${reference}`,
            metadata: {
              custom_fields: [
                {
                  display_name: "Reference Type",
                  variable_name: "ref_type",
                  value: "htu_departmental_dues"
                }
              ]
            }
          }),
        });

        const resData = await response.json();
        if (!response.ok || !resData.status) {
          throw new Error(resData.message || 'Failed to initialize Paystack transaction');
        }

        return {
          authorization_url: resData.data.authorization_url,
          reference: resData.data.reference,
          isMock: false
        };
      } catch (error) {
        console.error("Paystack Init Error:", error);
        throw error;
      }
    } else {
      // Return local simulated checkout page url in mock mode
      return {
        authorization_url: `/student/checkout?reference=${reference}&amount=${amountGHS}&email=${encodeURIComponent(email)}`,
        reference,
        isMock: true
      };
    }
  },

  async verify(reference) {
    if (this.isConfigured()) {
      try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
          },
        });

        const resData = await response.json();
        if (!response.ok || !resData.status) {
          throw new Error(resData.message || 'Failed to verify Paystack transaction');
        }

        return {
          status: resData.data.status, // 'success', 'failed', 'abandoned'
          amount: resData.data.amount / 100, // convert back to major currency unit
          reference: resData.data.reference,
          gateway_response: resData.data.gateway_response,
          paid_at: resData.data.paid_at,
          isMock: false
        };
      } catch (error) {
        console.error("Paystack Verification Error:", error);
        throw error;
      }
    } else {
      // In mock mode, we assume client-side simulation completed successfully
      // when requested from verification fallback
      return {
        status: 'success',
        amount: 0, // dynamic verify should load from mock db
        reference,
        gateway_response: 'Approved (Simulated)',
        paid_at: new Date().toISOString(),
        isMock: true
      };
    }
  },

  verifyWebhookSignature(signature, rawBody) {
    if (!this.isConfigured()) {
      return true; // Auto-pass in mock mode
    }

    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || paystackSecret)
        .update(rawBody)
        .digest('hex');
      return hash === signature;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }
};
