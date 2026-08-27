import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {platformFee,stripeRequest} from "@/lib/stripe";

type Relation<T>=T|T[]|null;const one=<T,>(v:Relation<T>)=>Array.isArray(v)?v[0]??null:v;
export async function POST(request:Request){
  try{
    const body=await request.json() as{requestId?:string;delivery?:"shipping"|"pickup"};
    if(!body.requestId||!body.delivery||!['shipping','pickup'].includes(body.delivery))throw new Error("Selecciona una forma de entrega.");
    const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Inicia sesión de nuevo.");
    const{data:purchase,error}=await supabase.from("market_requests").select("id,buyer_id,status,listing:market_listings(id,seller_id,price_cents,sticker:stickers(number,name,team))").eq("id",body.requestId).single();
    if(error||!purchase||purchase.buyer_id!==user.id||purchase.status!=="accepted")throw new Error("La solicitud todavía no está aceptada.");
    const listing=one(purchase.listing);if(!listing)throw new Error("El anuncio ya no está disponible.");
    const{data:payment}=await supabase.from("payment_accounts").select("stripe_account_id,charges_enabled,payouts_enabled").eq("user_id",listing.seller_id).maybeSingle();
    if(!payment?.charges_enabled||!payment.payouts_enabled)throw new Error("El vendedor todavía debe terminar la configuración de cobros.");
    const sticker=one(listing.sticker),shipping=body.delivery==="shipping"?399:0,fee=platformFee(listing.price_cents),origin=new URL(request.url).origin;
    const params=new URLSearchParams({mode:"payment",success_url:`${origin}/mercado/solicitudes?checkout=success&session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/mercado/solicitudes?checkout=cancelled`,customer_email:user.email||"","line_items[0][price_data][currency]":"eur","line_items[0][price_data][product_data][name]":`${sticker?.name||sticker?.team||"Cromo"} · #${sticker?.number||""}`,"line_items[0][price_data][unit_amount]":String(listing.price_cents),"line_items[0][quantity]":"1","payment_intent_data[application_fee_amount]":String(fee),"payment_intent_data[transfer_data][destination]":payment.stripe_account_id,"metadata[market_request_id]":purchase.id,"metadata[delivery_method]":body.delivery});
    if(shipping){params.set("line_items[1][price_data][currency]","eur");params.set("line_items[1][price_data][product_data][name]","Envío certificado con seguimiento");params.set("line_items[1][price_data][unit_amount]",String(shipping));params.set("line_items[1][quantity]","1");params.set("shipping_address_collection[allowed_countries][0]","ES");}
    const session=await stripeRequest<{id:string;url:string}>("/checkout/sessions",params);
    const{error:orderError}=await supabase.rpc("create_market_order",{p_request_id:purchase.id,p_delivery_method:body.delivery,p_checkout_session_id:session.id});
    if(orderError){await stripeRequest(`/checkout/sessions/${session.id}/expire`,new URLSearchParams()).catch(()=>null);throw orderError;}
    return NextResponse.json({url:session.url});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo iniciar el pago."},{status:400})}
}
