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

export const platformFee=(itemCents:number)=>Math.max(10,Math.round(itemCents*.05));

