import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const notifications: { user_id: string; title: string; message: string; type: string }[] = [];

    // 1. Check debts due within 3 days
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    const todayStr = today.toISOString().split("T")[0];
    const threeDaysStr = threeDaysLater.toISOString().split("T")[0];

    const { data: dueDebts } = await supabase
      .from("debts")
      .select("*")
      .eq("status", "unpaid")
      .not("due_date", "is", null)
      .lte("due_date", threeDaysStr)
      .gte("due_date", todayStr);

    for (const debt of dueDebts || []) {
      const daysLeft = Math.ceil(
        (new Date(debt.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const label = debt.type === "payable" ? "Hutang" : "Piutang";
      notifications.push({
        user_id: debt.user_id,
        title: `⏰ ${label} Jatuh Tempo ${daysLeft <= 0 ? "Hari Ini" : `${daysLeft} Hari Lagi`}`,
        message: `${label} kepada ${debt.person_name} sebesar ${formatCurrency(debt.amount - debt.paid_amount)} akan jatuh tempo.`,
        type: "debt_reminder",
      });
    }

    // 2. Check budgets exceeding 80%
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];

    const { data: budgets } = await supabase
      .from("budgets")
      .select("*, category:categories(*)")
      .eq("month", currentMonth)
      .eq("year", currentYear);

    for (const budget of budgets || []) {
      const { data: txns } = await supabase
        .from("transactions")
        .select("amount")
        .eq("category_id", budget.category_id)
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate);

      const spent = (txns || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const pct = (spent / budget.amount) * 100;

      if (pct >= 80 && pct < 100) {
        notifications.push({
          user_id: budget.user_id,
          title: `⚠️ Anggaran ${budget.category?.name || ""} Hampir Habis`,
          message: `Pengeluaran ${budget.category?.name || ""} sudah ${Math.round(pct)}% dari anggaran ${formatCurrency(budget.amount)}.`,
          type: "budget_warning",
        });
      } else if (pct >= 100) {
        notifications.push({
          user_id: budget.user_id,
          title: `🚨 Anggaran ${budget.category?.name || ""} Terlampaui!`,
          message: `Pengeluaran ${budget.category?.name || ""} sudah ${formatCurrency(spent)} (${Math.round(pct)}%) dari anggaran ${formatCurrency(budget.amount)}.`,
          type: "budget_exceeded",
        });
      }
    }

    // 3. Check recurring transactions due tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: upcomingRecurring } = await supabase
      .from("recurring_transactions")
      .select("*, category:categories(name)")
      .eq("is_active", true)
      .eq("next_run_date", tomorrowStr);

    for (const rt of upcomingRecurring || []) {
      notifications.push({
        user_id: rt.user_id,
        title: `🔄 Transaksi Berulang Besok`,
        message: `${rt.category?.name || rt.note || "Transaksi"} sebesar ${formatCurrency(rt.amount)} akan diproses besok.`,
        type: "recurring_reminder",
      });
    }

    // Deduplicate: skip if same title+user already has notification today
    let inserted = 0;
    for (const notif of notifications) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", notif.user_id)
        .eq("title", notif.title)
        .gte("created_at", todayStr)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("notifications").insert(notif);
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, checked: notifications.length, inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
