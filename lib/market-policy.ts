export const MARKET_PAYMENTS_LAUNCH_AT="2026-09-30T22:00:00.000Z";
export const ORDINARY_MAIL_CENTS=149;
export const TRACKED_MAIL_CENTS=399;
export const TRACKED_MAIL_THRESHOLD_CENTS=500;

export const marketPaymentsAvailable=()=>Date.now()>=new Date(MARKET_PAYMENTS_LAUNCH_AT).getTime();
export const shippingCentsFor=(itemCents:number)=>itemCents>TRACKED_MAIL_THRESHOLD_CENTS?TRACKED_MAIL_CENTS:ORDINARY_MAIL_CENTS;
export const shippingLabelFor=(itemCents:number)=>itemCents>TRACKED_MAIL_THRESHOLD_CENTS?"Correos con seguimiento":"Carta con sello";

