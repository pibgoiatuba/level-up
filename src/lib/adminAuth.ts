import crypto from "crypto";

const getAdminSecret = () => process.env.ADMIN_PASSWORD || "admin123";

export const generateAdminToken = (): string => {
  const secret = getAdminSecret();
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac("sha256", secret).update(timestamp).digest("hex");
  return `${timestamp}.${signature}`;
};

export const verifyAdminToken = (token: string | null | undefined): boolean => {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [timestamp, signature] = parts;

  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime) || Date.now() - tokenTime > 7 * 24 * 60 * 60 * 1000) {
    return false; // Expired after 7 days
  }

  try {
    const secret = getAdminSecret();
    const expectedSignature = crypto.createHmac("sha256", secret).update(timestamp).digest("hex");
    if (signature.length !== expectedSignature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
};

export const checkAdminAuth = (request: Request): boolean => {
  // Check cookie or Authorization header
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin_token=([^;]+)/);
  const tokenFromCookie = match ? match[1] : null;

  const authHeader = request.headers.get("authorization") || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  return verifyAdminToken(tokenFromCookie || tokenFromHeader);
};

