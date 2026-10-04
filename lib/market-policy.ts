export const MARKET_PAYMENTS_LAUNCH_AT="2026-09-30T22:00:00.000Z";
export const ORDINARY_MAIL_CENTS=149;
export const TRACKED_MAIL_CENTS=399;
export const TRACKED_MAIL_THRESHOLD_CENTS=500;

export const marketPaymentsAvailable=()=>Date.now()>=new Date(MARKET_PAYMENTS_LAUNCH_AT).getTime();
export const shippingCentsFor=(itemCents:number)=>itemCents>TRACKED_MAIL_THRESHOLD_CENTS?TRACKED_MAIL_CENTS:ORDINARY_MAIL_CENTS;
export const shippingLabelFor=(itemCents:number)=>itemCents>TRACKED_MAIL_THRESHOLD_CENTS?"Correos con seguimiento":"Carta con sello";

// Commission is based on the item only, rounded to cents, with a 10-cent minimum.
export function platformFee(itemCents:number){
  if(!Number.isSafeInteger(itemCents)||itemCents<1||itemCents>100000){
    throw new Error("El precio del cromo no es válido.");
  }
  return Math.max(10,Math.floor((itemCents+10)/20));
}

// Tracked postage is retained by CromoNexo to purchase the label manually.
// Ordinary postage still goes to the seller who buys the stamp.
export function checkoutAllocation(itemCents:number, delivery:"shipping"|"pickup") {
  const commissionCents=platformFee(itemCents);
  const shippingCents=delivery==="shipping"?shippingCentsFor(itemCents):0;
  const managed=delivery==="shipping"&&itemCents>TRACKED_MAIL_THRESHOLD_CENTS;
  const retainedShippingCents=managed?shippingCents:0;
  return {commissionCents,shippingCents,managed,retainedShippingCents,applicationFeeCents:commissionCents+retainedShippingCents};
}
