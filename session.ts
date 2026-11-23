import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "familia_admin";
function signature(value: string) {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "troque-esta-chave";
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function makeAdminToken() {
  const payload = `admin:${Date.now()}`;
  return `${payload}.${signature(payload)}`;
}
export async function isAdmin() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i), sig = token.slice(i + 1);
  const expected = signature(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch { return false; }
  const timestamp = Number(payload.split(":")[1]);
  return payload.startsWith("admin:") && Number.isFinite(timestamp) && Date.now() - timestamp < 1000 * 60 * 60 * 12;
}
export const adminCookieName = COOKIE;
