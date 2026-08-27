import {createHmac,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";

export const runtime="nodejs";

type StripeEvent={
  id:string;
  type:string;
  livemode:boolean;
  data:{object:{id:string;payment_status?:string;payment_intent?:string|null}};
};

function verifySignature(payload:string,header:string,secret:string){
  const parts=header.split(",").map(part=>part.split("=",2));
  const timestamp=parts.find(([key])=>key==="t")?.[1];
  const signatures=parts.filter(([key])=>key==="v1").map(([,value])=>value);
  if(!timestamp||signatures.length===0)return false;
  if(Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
  const expected=createHmac("sha256",secret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some(signature=>{
    if(signature.length!==expected.length)return false;
    return timingSafeEqual(Buffer.from(signature),Buffer.from(expected));
  });
}

export async function POST(request:Request){
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  const signature=request.headers.get("stripe-signature");
  const payload=await request.text();
  if(!secret||!signature||!verifySignature(payload,signature,secret)){
    return NextResponse.json({error:"Firma de Stripe no válida"},{status:400});
  }

  let event:StripeEvent;
  try{event=JSON.parse(payload) as StripeEvent;}
  catch{return NextResponse.json({error:"Evento no válido"},{status:400});}

  const session=event.data.object;
  const supabase=createAdminClient();
  if((event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded")&&session.payment_status==="paid"&&session.payment_intent){
    const{error}=await supabase.from("market_orders").update({payment_status:"paid",stripe_payment_intent_id:session.payment_intent,updated_at:new Date().toISOString()}).eq("stripe_checkout_session_id",session.id).eq("payment_status","pending");
    if(error)return NextResponse.json({error:"No se pudo registrar el pago"},{status:500});
  }
  if(event.type==="checkout.session.async_payment_failed"||event.type==="checkout.session.expired"){
    const{error}=await supabase.from("market_orders").update({payment_status:"failed",updated_at:new Date().toISOString()}).eq("stripe_checkout_session_id",session.id).eq("payment_status","pending");
    if(error)return NextResponse.json({error:"No se pudo registrar el fallo"},{status:500});
  }
  return NextResponse.json({received:true});
}
