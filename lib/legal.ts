export const legal = {
  projectName: "CromoNexo",
  ownerName: process.env.NEXT_PUBLIC_LEGAL_OWNER_NAME || "PENDIENTE DE COMPLETAR",
  taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID || "PENDIENTE DE COMPLETAR",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "PENDIENTE DE COMPLETAR",
  phone: process.env.NEXT_PUBLIC_LEGAL_PHONE || "PENDIENTE DE COMPLETAR",
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || "PENDIENTE DE COMPLETAR",
  updatedAt: "19 de agosto de 2026",
};

export const legalIsComplete = Object.values(legal).every((value) => !value.startsWith("PENDIENTE"));
