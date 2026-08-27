import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {stripeRequest,stripeV2Request} from "@/lib/stripe";

type Account={id:string;configuration?:{recipient?:{capabilities?:{stripe_balance?:{stripe_transfers?:{status?:string}}}}}};
const accountReady=(account:Account)=>account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status==="active";

export async function POST(request:Request){
  try{
    const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({error:"Inicia sesión para configurar los cobros."},{status:401});
    const{data:saved}=await supabase.from("payment_accounts").select("stripe_account_id").eq("user_id",user.id).maybeSingle();
    let accountId=saved?.stripe_account_id;
    if(!accountId){
      const account=await stripeV2Request<Account>("/core/accounts",{
        contact_email:user.email||undefined,
        display_name:user.email?.split("@")[0]||"Coleccionista CromoNexo",
        dashboard:"express",
        identity:{country:"es"},
        defaults:{currency:"eur",locales:["es-ES"],responsibilities:{fees_collector:"application",losses_collector:"application"}},
        configuration:{recipient:{capabilities:{stripe_balance:{stripe_transfers:{requested:true}}}}},
        include:["configuration.recipient","identity","requirements"],
      });
      accountId=account.id;
      const{error}=await supabase.rpc("save_payment_account",{p_stripe_account_id:accountId});if(error)throw error;
    }
    const account=await stripeV2Request<Account>(`/core/accounts/${accountId}?include%5B%5D=configuration.recipient&include%5B%5D=requirements`,undefined,"GET");
    const ready=accountReady(account);
    await supabase.rpc("update_payment_account_status",{p_charges:ready,p_payouts:ready,p_complete:ready});
    if(ready){
      const link=await stripeRequest<{url:string}>(`/accounts/${accountId}/login_links`,new URLSearchParams());
      return NextResponse.json({url:link.url});
    }
    const origin=new URL(request.url).origin;
    const link=await stripeV2Request<{url:string}>("/core/account_links",{
      account:accountId,
      use_case:{type:"account_onboarding",account_onboarding:{configurations:["recipient"],refresh_url:`${origin}/mercado/solicitudes?stripe=refresh`,return_url:`${origin}/mercado/solicitudes?stripe=return`,collection_options:{fields:"eventually_due",future_requirements:"include"}}},
    });
    return NextResponse.json({url:link.url});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo abrir Stripe."},{status:400})}
}
