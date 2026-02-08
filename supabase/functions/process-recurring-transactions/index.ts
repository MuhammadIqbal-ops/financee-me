import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RecurringTransaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: "income" | "expense";
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  note: string | null;
  is_active: boolean;
}

function calculateNextRunDate(
  currentDate: Date,
  frequency: RecurringTransaction["frequency"]
): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];

    // Get all active recurring transactions that are due
    const { data: dueTransactions, error: fetchError } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`);

    if (fetchError) {
      throw new Error(`Failed to fetch recurring transactions: ${fetchError.message}`);
    }

    const results = {
      processed: 0,
      created: 0,
      errors: [] as string[],
    };

    for (const rt of dueTransactions as RecurringTransaction[]) {
      try {
        // Create the transaction
        const { error: insertError } = await supabase
          .from("transactions")
          .insert({
            user_id: rt.user_id,
            category_id: rt.category_id,
            amount: rt.amount,
            type: rt.type,
            date: rt.next_run_date,
            note: rt.note ? `[Auto] ${rt.note}` : "[Auto] Transaksi berulang",
          });

        if (insertError) {
          results.errors.push(`Failed to create transaction for ${rt.id}: ${insertError.message}`);
          continue;
        }

        results.created++;

        // Calculate next run date
        const nextRunDate = calculateNextRunDate(
          new Date(rt.next_run_date),
          rt.frequency
        );

        // Check if end_date is reached
        const shouldDeactivate =
          rt.end_date && new Date(rt.end_date) < nextRunDate;

        // Update the recurring transaction
        const { error: updateError } = await supabase
          .from("recurring_transactions")
          .update({
            next_run_date: nextRunDate.toISOString().split("T")[0],
            is_active: !shouldDeactivate,
          })
          .eq("id", rt.id);

        if (updateError) {
          results.errors.push(`Failed to update recurring transaction ${rt.id}: ${updateError.message}`);
          continue;
        }

        results.processed++;
      } catch (err) {
        results.errors.push(`Error processing ${rt.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} recurring transactions, created ${results.created} transactions`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
