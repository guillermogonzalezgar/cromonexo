import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const {renderToStaticMarkup} = require("react-dom/server");

function loadTs(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const {outputText} = ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020,
  }});
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, require: name => name in mocks ? mocks[name] : require(name),
    URLSearchParams, URL, Request, Response, Date, console, File, Buffer, process,
  }, {filename: path});
  return exports;
}

const policy = loadTs("../lib/market-policy.ts");
const clientMocks = {
  "next/navigation": {useRouter: () => ({refresh() {}})},
  "@/lib/supabase/client": {createClient() {throw new Error("Rendering must not mutate orders");}},
};
const {default: ManagedShipping} = loadTs("../app/mercado/solicitudes/managed-shipping.tsx", clientMocks);
const {OrderActions} = loadTs("../app/mercado/solicitudes/payment-actions.tsx", {
  "@/lib/market-policy": policy,
  "./managed-shipping": {default: ManagedShipping, __esModule:true},
  "next/navigation": {useRouter: () => ({refresh() {}})},
  "@/lib/supabase/client": {createClient() {throw new Error("Rendering must not mutate orders");}},
});
const base = {orderId: "order-1", incoming: true, delivery: "shipping", shippingCents: 149, shipped: false, received: false};
const render = props => renderToStaticMarkup(React.createElement(OrderActions, {...base, ...props}));

test("commission keeps the 10-cent minimum and rounds 5 percent to cents", () => {
  for (const [item, fee] of [[50,10],[100,10],[199,10],[200,10],[209,10],[210,11],[500,25],[501,25],[1000,50],[100000,5000]]) {
    assert.equal(policy.platformFee(item), fee, `${item} cents`);
  }
  for (const value of [0,-1,1.5,NaN,Infinity,100001]) assert.throws(() => policy.platformFee(value));
});

test("shipping threshold includes exactly 5 euros in ordinary mail", () => {
  assert.equal(policy.shippingCentsFor(500), 149);
  assert.equal(policy.shippingCentsFor(501), 399);
});

test("pickup requires no shipping or receipt actions for either participant", () => {
  for (const incoming of [true,false]) for (const received of [true,false]) {
    const html = render({delivery: "pickup", incoming, received});
    assert.doesNotMatch(html, /<button|<input|Pedido recibido y completado/);
    assert.match(html, /No tenéis que marcar el envío ni confirmar la recepción/);
  }
});

test("ordinary mail gives the seller one button and no tracking fields", () => {
  const html = render({});
  assert.equal((html.match(/<button/g) ?? []).length, 1);
  assert.match(html, /Carta enviada/);
  assert.doesNotMatch(html, /<input/);
  assert.doesNotMatch(render({incoming: false}), /<button/);
});

test("sent letters cannot be sent twice and the buyer may confirm receipt", () => {
  assert.doesNotMatch(render({shipped: true}), /<button/);
  assert.match(render({shipped: true}), /Enviado. Pendiente de recepción/);
  assert.match(render({incoming: false, shipped: true}), /Confirmar recepción/);
  assert.doesNotMatch(render({incoming: false, shipped: true, received: true}), /<button/);
});

test("legacy tracked shipments keep their original seller-managed form", () => {
  const html = render({shippingCents: 399});
  assert.match(html, /aria-label="Número de seguimiento"/);
  assert.match(html, /<button disabled=""/);
});

test("checkout collects the platform commission for pickup and both postal methods", async () => {
  for (const [itemCents,delivery,expectedFee,expectedShipping] of [[100,"pickup",10,0],[1000,"pickup",50,0],[100,"shipping",10,149],[1000,"shipping",449,399]]) {
    let checkoutParams;
    let orderParams;
    const supabase = {
      auth: {getUser: async () => ({data: {user: {id:"buyer",email:"buyer@example.test"}}})},
      from(table) {
        const query = {
          select() {return query;}, eq() {return query;},
          async single() {return {data: {id:"request",buyer_id:"buyer",status:"accepted",listing:{id:"listing",seller_id:"seller",price_cents:itemCents,sticker:{number:1,name:"Cromo"}}}};},
          async maybeSingle() {assert.equal(table,"payment_accounts");return {data:{stripe_account_id:"acct_seller",charges_enabled:true,payouts_enabled:true}};},
        };
        return query;
      },
      async rpc(name,params) {assert.equal(name,"create_market_order_v3");orderParams=params;return {error:null};},
    };
    const {POST} = loadTs("../app/api/stripe/checkout/route.ts", {
      "@/lib/supabase/server": {createClient: async () => supabase},
      "@/lib/market-policy": {...policy, marketPaymentsAvailable: () => true},
      "@/lib/stripe": {
        platformFee: policy.platformFee, stripeLiveMode: () => false,
        async stripeRequest(path,params) {
          assert.equal(path,"/checkout/sessions");checkoutParams=params;
          return {id:"cs_test",url:"https://checkout.stripe.com/test"};
        },
      },
    });
    const response=await POST(new Request("https://example.test/api/stripe/checkout", {method:"POST",body:JSON.stringify({requestId:"request",delivery})}));
    assert.equal(response.status,200);
    assert.equal(checkoutParams.get("payment_intent_data[application_fee_amount]"),String(expectedFee));
    assert.equal(checkoutParams.get("payment_intent_data[transfer_data][destination]"),"acct_seller");
    assert.equal(checkoutParams.get("line_items[1][price_data][unit_amount]"),expectedShipping ? String(expectedShipping) : null);
    assert.equal(orderParams.p_delivery_method,delivery);
    assert.equal(orderParams.p_livemode,false);
    assert.equal(checkoutParams.get("metadata[commission_cents]"),String(policy.platformFee(itemCents)));
    assert.equal(checkoutParams.get("metadata[retained_shipping_cents]"),expectedShipping===399?"399":"0");
    assert.equal(checkoutParams.get("metadata[shipping_management]"),expectedShipping===399?"cromonexo_manual":"seller");
  }
});


test("platform-managed shipments show sender form then private label, not manual tracking input", () => {
  const pending=render({managed:true,shippingCents:399});
  assert.match(pending,/Enviar datos a CromoNexo/);
  assert.doesNotMatch(pending,/aria-label="Número de seguimiento"/);
  const ready=render({managed:true,shippingCents:399,trackingCode:"TRACK12345",labelReady:true});
  assert.match(ready,/Descargar etiqueta PDF/);
  assert.match(ready,/Paquete entregado en Correos/);
  assert.doesNotMatch(ready,/Enviar datos a CromoNexo/);
  const buyer=render({managed:true,shippingCents:399,incoming:false});
  assert.doesNotMatch(buyer,/<input|<button|<form/);
  assert.match(buyer,/CromoNexo está gestionando el envío/);
});

const adminPolicy=loadTs("../lib/shipping-admin.ts", {"server-only":{}});
test("only the verified shipping owner is an administrator", () => {
  assert.equal(adminPolicy.isShippingAdmin(null),false);
  assert.equal(adminPolicy.isShippingAdmin({email:"comunicacion@cromonexo.com"}),false);
  assert.equal(adminPolicy.isShippingAdmin({email:"attacker@example.test",email_confirmed_at:"2026-01-01"}),false);
  assert.equal(adminPolicy.isShippingAdmin({email:"Comunicacion@CromoNexo.com",email_confirmed_at:"2026-01-01"}),true);
});

test("sender data requires an address, Spanish postal code and phone", () => {
  const {parseSenderAddress}=loadTs("../lib/manual-shipping.ts");
  const valid={name:" Ana Pérez ",address:"Calle Ejemplo 1",postalCode:"28001",city:"Madrid",phone:"+34 600 123 456"};
  assert.equal(parseSenderAddress(valid).name,"Ana Pérez");
  for(const invalid of [null,{}, {...valid,postalCode:"123"},{...valid,phone:"abc"},{...valid,address:42}]) assert.equal(parseSenderAddress(invalid),null);
});

test("administrator API rejects other accounts before loading orders or uploading labels", async () => {
  const {POST}=loadTs("../app/api/admin/envios/[id]/route.ts",{
    "@/lib/supabase/server":{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:"other",email:"other@example.test",email_confirmed_at:"yes"}}})}})},
    "@/lib/shipping-admin":adminPolicy,
    "@/lib/shipping-orders":{getManagedShippingOrder(){throw new Error("Must not load privileged data");}},
  });
  const response=await POST(new Request("https://example.test/api/admin/envios/id",{method:"POST"}),{params:Promise.resolve({id:"id"})});
  assert.equal(response.status,403);
});

test("a buyer cannot retrieve a seller shipping label", async () => {
  const {GET}=loadTs("../app/api/envios/[id]/etiqueta/route.ts",{
    "@/lib/supabase/server":{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:"buyer",email:"buyer@example.test",email_confirmed_at:"yes"}}})},from(){const q={select(){return q;},eq(){return q;},single:async()=>({data:{seller_id:"seller",payment_status:"paid",shipping_managed_by_platform:true}})};return q;},storage:{from(){throw new Error("Must not sign a URL");}}})},
    "@/lib/shipping-admin":adminPolicy,
  });
  const response=await GET(new Request("https://example.test/api/envios/id/etiqueta"),{params:Promise.resolve({id:"id"})});
  assert.equal(response.status,404);
});


test("shipping administration rejects unpaid, mismatched and legacy Stripe sessions", async () => {
  const good={payment_status:"paid",livemode:false,metadata:{shipping_management:"cromonexo_manual"},amount_total:1399};
  const order={stripe_checkout_session_id:"cs_test_1",total_cents:1399};
  for(const session of [{...good,payment_status:"unpaid"},{...good,livemode:true},{...good,metadata:{}},{...good,amount_total:100}]) {
    const {getManagedShippingOrder}=loadTs("../lib/shipping-orders.ts", {
      "server-only":{},
      "@/lib/supabase/server":{createClient:async()=>({from(){const q={select(){return q;},eq(){return q;},single:async()=>({data:order})};return q;}})},
      "@/lib/stripe":{stripeLiveMode:()=>false,stripeRequest:async()=>session},
    });
    await assert.rejects(getManagedShippingOrder("order"));
  }
});
