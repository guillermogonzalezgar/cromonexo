export type SenderAddress = {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
};

export function parseSenderAddress(input: unknown): SenderAddress | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const fields = ["name", "address", "postalCode", "city", "phone"] as const;
  if (fields.some(key => typeof value[key] !== "string")) return null;
  const sender = Object.fromEntries(fields.map(key => [key, (value[key] as string).trim()])) as SenderAddress;
  if (sender.name.length < 2 || sender.name.length > 120 || sender.address.length < 5 || sender.address.length > 200 || sender.city.length < 2 || sender.city.length > 100) return null;
  if (!/^\d{5}$/.test(sender.postalCode) || !/^\+?[\d ()-]{9,20}$/.test(sender.phone)) return null;
  return sender;
}
