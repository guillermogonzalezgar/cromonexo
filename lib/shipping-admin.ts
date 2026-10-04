import "server-only";

type ShippingUser = {email?: string; email_confirmed_at?: string | null} | null;

export function isShippingAdmin(user: ShippingUser): boolean {
  return Boolean(user?.email_confirmed_at && user.email?.trim().toLowerCase() === "comunicacion@cromonexo.com");
}
