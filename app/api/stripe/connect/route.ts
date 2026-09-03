import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {stripeLiveMode,stripeRequest,stripeV2Request} from "@/lib/stripe";

type Account={id:string;configuration?:{recipient?:{capabilities?:{stripe_balance?:{stripe_transfers?:{status?:string}}}}}};
type PlatformAccount={id:string;charges_enabled:boolean;payouts_enabled:boolean;details_submitted:boolean;country?:string};
const accountReady=(account:Account)=>account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status==="active";

export async function POST(request:Request){
  let platform:PlatformAccount|undefined;
  let livemode=false;
  try{
    const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();
    if(!user)return NextResponse.json({error:"Inicia sesión para configurar los cobros."},{status:401});
    livemode=stripeLiveMode();
    platform=await stripeRequest<PlatformAccount>("/account",undefined,"GET");
    if(livemode&&(!platform.details_submitted||!platform.charges_enabled)){
      return NextResponse.json({
        error:`La clave activa de Netlify pertenece a ${platform.id}, pero Stripe todavía considera incompleta esa cuenta. Comprueba en Stripe que estás dentro de esa misma cuenta y termina “Verifica tu empresa” y la configuración de Connect.`,
        code:"stripe_platform_not_active",
        platformAccountId:platform.id,
      },{status:409});
    }
    const{data:saved}=await supabase.from("payment_accounts").select("stripe_account_id").eq("user_id",user.id).eq("livemode",livemode).maybeSingle();
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
      const{error}=await supabase.rpc("save_payment_account",{p_stripe_account_id:accountId,p_livemode:livemode});if(error)throw error;
    }
    const account=await stripeV2Request<Account>(`/core/accounts/${accountId}?include%5B0%5D=configuration.recipient&include%5B1%5D=requirements`,undefined,"GET");
    const ready=accountReady(account);
    await supabase.rpc("update_payment_account_status",{p_charges:ready,p_payouts:ready,p_complete:ready,p_livemode:livemode});
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
  }catch(error){
    const message=error instanceof Error?error.message:"No se pudo abrir Stripe.";
    if(message.includes("must be activated")){
      const account=platform?.id||"desconocida";
      const mode=livemode?"REAL":"PRUEBA";
      return NextResponse.json({
        error:`Stripe ha rechazado la creación del vendedor. La web está usando la cuenta ${account} en modo ${mode}. Comprueba que ese ID coincide con la cuenta activa del Dashboard. Si coincide, contacta con soporte de Stripe para que habiliten la creación de cuentas Connect en modo real.`,
        code:"stripe_connect_not_activated",
        platformAccountId:platform?.id,
        livemode,
        platformStatus:platform?{chargesEnabled:platform.charges_enabled,payoutsEnabled:platform.payouts_enabled,detailsSubmitted:platform.details_submitted}:undefined,
      },{status:409});
    }
    return NextResponse.json({error:message},{status:400});
  }
}
