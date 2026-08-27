import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {stripeRequest} from "@/lib/stripe";

type Account={id:string;charges_enabled:boolean;payouts_enabled:boolean;details_submitted:boolean};
export async function POST(request:Request){
  try{
    const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({error:"Inicia sesión para configurar los cobros."},{status:401});
    const{data:saved}=await supabase.from("payment_accounts").select("stripe_account_id").eq("user_id",user.id).maybeSingle();
    let accountId=saved?.stripe_account_id;
    if(!accountId){
      const params=new URLSearchParams({type:"express",country:"ES",email:user.email||"","capabilities[card_payments][requested]":"true","capabilities[transfers][requested]":"true"});
      const account=await stripeRequest<Account>("/accounts",params);accountId=account.id;
      const{error}=await supabase.rpc("save_payment_account",{p_stripe_account_id:accountId});if(error)throw error;
    }
    const account=await stripeRequest<Account>(`/accounts/${accountId}`,undefined,"GET");
    await supabase.rpc("update_payment_account_status",{p_charges:account.charges_enabled,p_payouts:account.payouts_enabled,p_complete:account.details_submitted});
    if(account.charges_enabled&&account.payouts_enabled){
      const link=await stripeRequest<{url:string}>(`/accounts/${accountId}/login_links`,new URLSearchParams());
      return NextResponse.json({url:link.url});
    }
    const origin=new URL(request.url).origin;
    const link=await stripeRequest<{url:string}>("/account_links",new URLSearchParams({account:accountId,refresh_url:`${origin}/mercado/solicitudes?stripe=refresh`,return_url:`${origin}/mercado/solicitudes?stripe=return`,type:"account_onboarding"}));
    return NextResponse.json({url:link.url});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo abrir Stripe."},{status:400})}
}

