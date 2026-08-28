import "server-only";

export async function stripeRequest<T>(path:string,params?:URLSearchParams,method:"GET"|"POST"="POST"):Promise<T>{
  const secret=process.env.STRIPE_SECRET_KEY;
  if(!secret)throw new Error("Stripe no está configurado");
  const response=await fetch(`https://api.stripe.com/v1${path}`,{
    method,headers:{Authorization:`Bearer ${secret}`,...(params?{"Content-Type":"application/x-www-form-urlencoded"}:{})},
    body:params?.toString(),cache:"no-store",
  });
  const data=await response.json();
  if(!response.ok)throw new Error(data?.error?.message||"Stripe ha rechazado la operación");
  return data as T;
}

export async function stripeV2Request<T>(path:string,body?:unknown,method:"GET"|"POST"="POST"):Promise<T>{
  const secret=process.env.STRIPE_SECRET_KEY;
  if(!secret)throw new Error("Stripe no está configurado");
  const response=await fetch(`https://api.stripe.com/v2${path}`,{
    method,
    headers:{Authorization:`Bearer ${secret}`,"Stripe-Version":"2026-08-26.preview",...(body?{"Content-Type":"application/json"}:{})},
    body:body?JSON.stringify(body):undefined,
    cache:"no-store",
  });
  const data=await response.json();
  if(!response.ok)throw new Error(data?.error?.message||"Stripe ha rechazado la operación");
  return data as T;
}

export const platformFee=(itemCents:number)=>Math.max(10,Math.round(itemCents*.05));
export const stripeLiveMode=()=>process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")??false;
