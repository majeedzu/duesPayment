// Session management helper for client and server

export const SESSION_COOKIE_NAME = 'htu_session';

export function getClientSession() {
  if (typeof window === 'undefined') return null;
  try {
    const name = SESSION_COOKIE_NAME + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return JSON.parse(c.substring(name.length, c.length));
      }
    }
  } catch (error) {
    console.error("Error reading client session:", error);
  }
  return null;
}

export function setClientSession(userData, days = 7) {
  if (typeof window === 'undefined') return;
  try {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(userData))}; ${expires}; path=/`;
  } catch (error) {
    console.error("Error setting client session:", error);
  }
}

export function clearClientSession() {
  if (typeof window === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Server side helper (Next.js API route / Server Component)
export function getServerSession(req) {
  try {
    let cookieVal = null;
    
    // Check if it's an API request object or NextRequest
    if (req.cookies && typeof req.cookies.get === 'function') {
      // NextRequest
      const cookie = req.cookies.get(SESSION_COOKIE_NAME);
      cookieVal = cookie ? cookie.value : null;
    } else if (req.headers && req.headers.cookie) {
      // Standard Node HTTP Request
      const name = SESSION_COOKIE_NAME + "=";
      const ca = req.headers.cookie.split(';');
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) == 0) {
          cookieVal = c.substring(name.length, c.length);
          break;
        }
      }
    }

    if (cookieVal) {
      return JSON.parse(decodeURIComponent(cookieVal));
    }
  } catch (error) {
    console.error("Error reading server session:", error);
  }
  return null;
}
