import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base = "USD" } = await req.json().catch(() => ({}));
    const baseCurrency = String(base).toUpperCase();

    // Use frankfurter.app - free, no API key needed
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();
    const rates = data.rates as Record<string, number>;

    // Cache rates in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const upsertData = Object.entries(rates).map(([target, rate]) => ({
      base_currency: baseCurrency,
      target_currency: target,
      rate,
      fetched_at: new Date().toISOString(),
    }));

    // Also add inverse rates
    for (const [target, rate] of Object.entries(rates)) {
      upsertData.push({
        base_currency: target,
        target_currency: baseCurrency,
        rate: 1 / rate,
        fetched_at: new Date().toISOString(),
      });
    }

    await supabase
      .from("exchange_rates")
      .upsert(upsertData, { onConflict: "base_currency,target_currency" });

    return new Response(
      JSON.stringify({
        success: true,
        base: baseCurrency,
        date: data.date,
        rates,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
