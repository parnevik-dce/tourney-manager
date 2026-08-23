import { createClient } from "@/lib/supabase/server";
import { getCurrentTournament } from "@/lib/tournament";
import { BudgetSubNav } from "@/components/budget-sub-nav";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function varianceColor(variance: number) {
  if (variance > 0) return "text-red-600";
  if (variance < 0) return "text-green-600";
  return "text-slate-500";
}

function formatSigned(amount: number) {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${currency.format(Math.abs(amount))}`;
}

function groupByCategory(
  items: { category: string; forecasted_amount: number; actual_amount: number | null }[],
) {
  const map = new Map<string, { forecast: number; actual: number }>();
  for (const item of items) {
    const entry = map.get(item.category) ?? { forecast: 0, actual: 0 };
    entry.forecast += item.forecasted_amount;
    entry.actual += item.actual_amount ?? 0;
    map.set(item.category, entry);
  }
  return [...map.entries()]
    .map(([category, totals]) => ({ category, ...totals }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export default async function BudgetPnlPage() {
  const supabase = await createClient();
  const tournament = await getCurrentTournament();

  const { data: rawItems } = tournament
    ? await supabase
        .from("budget_items")
        .select("category, forecasted_amount, actual_amount, is_revenue")
        .eq("tournament_id", tournament.id)
    : { data: null };

  const items = rawItems ?? [];
  const revenueItems = items.filter((i) => i.is_revenue);
  const expenseItems = items.filter((i) => !i.is_revenue);

  const revenueByCategory = groupByCategory(revenueItems);
  const expenseByCategory = groupByCategory(expenseItems);

  const totalRevenueForecast = revenueByCategory.reduce(
    (s, c) => s + c.forecast,
    0,
  );
  const totalRevenueActual = revenueByCategory.reduce(
    (s, c) => s + c.actual,
    0,
  );
  const totalExpenseForecast = expenseByCategory.reduce(
    (s, c) => s + c.forecast,
    0,
  );
  const totalExpenseActual = expenseByCategory.reduce(
    (s, c) => s + c.actual,
    0,
  );

  const netForecast = totalRevenueForecast - totalExpenseForecast;
  const netActual = totalRevenueActual - totalExpenseActual;

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">
        Tournament P&amp;L
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Revenue and expenses by category, based on each budget item&apos;s
        Revenue flag.
      </p>

      <BudgetSubNav />

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments before tracking a
          budget.
        </p>
      )}

      {tournament && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Revenue
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {currency.format(totalRevenueActual)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Forecast {currency.format(totalRevenueForecast)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Expenses
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {currency.format(totalExpenseActual)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Forecast {currency.format(totalExpenseForecast)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Net Profit
            </p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                netActual >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatSigned(netActual)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Forecast {formatSigned(netForecast)}
            </p>
          </div>
        </div>
      )}

      {tournament && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <div className="min-w-[500px] text-sm">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-slate-100 px-5 py-2 text-left text-xs uppercase tracking-wide text-slate-400">
              <span>Revenue by Category</span>
              <span className="text-right">Forecast</span>
              <span className="text-right">Actual</span>
              <span className="text-right">Variance</span>
            </div>
            <div className="divide-y divide-slate-50">
              {revenueByCategory.length ? (
                revenueByCategory.map((c) => {
                  const variance = c.actual - c.forecast;
                  return (
                    <div
                      key={c.category}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 px-5 py-3"
                    >
                      <span className="font-medium text-slate-900">
                        {c.category}
                      </span>
                      <span className="text-right text-slate-700">
                        {currency.format(c.forecast)}
                      </span>
                      <span className="text-right text-slate-700">
                        {currency.format(c.actual)}
                      </span>
                      <span
                        className={`text-right ${varianceColor(variance)}`}
                      >
                        {formatSigned(variance)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="px-5 py-6 text-center text-sm text-slate-500">
                  No revenue items yet.
                </p>
              )}
              {revenueByCategory.length > 0 && (
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 bg-slate-50 px-5 py-3 font-medium text-slate-900">
                  <span>Total Revenue</span>
                  <span className="text-right">
                    {currency.format(totalRevenueForecast)}
                  </span>
                  <span className="text-right">
                    {currency.format(totalRevenueActual)}
                  </span>
                  <span
                    className={`text-right ${varianceColor(
                      totalRevenueActual - totalRevenueForecast,
                    )}`}
                  >
                    {formatSigned(totalRevenueActual - totalRevenueForecast)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tournament && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <div className="min-w-[500px] text-sm">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-slate-100 px-5 py-2 text-left text-xs uppercase tracking-wide text-slate-400">
              <span>Expenses by Category</span>
              <span className="text-right">Forecast</span>
              <span className="text-right">Actual</span>
              <span className="text-right">Variance</span>
            </div>
            <div className="divide-y divide-slate-50">
              {expenseByCategory.length ? (
                expenseByCategory.map((c) => {
                  const variance = c.actual - c.forecast;
                  return (
                    <div
                      key={c.category}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 px-5 py-3"
                    >
                      <span className="font-medium text-slate-900">
                        {c.category}
                      </span>
                      <span className="text-right text-slate-700">
                        {currency.format(c.forecast)}
                      </span>
                      <span className="text-right text-slate-700">
                        {currency.format(c.actual)}
                      </span>
                      <span
                        className={`text-right ${varianceColor(variance)}`}
                      >
                        {formatSigned(variance)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="px-5 py-6 text-center text-sm text-slate-500">
                  No expense items yet.
                </p>
              )}
              {expenseByCategory.length > 0 && (
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 bg-slate-50 px-5 py-3 font-medium text-slate-900">
                  <span>Total Expenses</span>
                  <span className="text-right">
                    {currency.format(totalExpenseForecast)}
                  </span>
                  <span className="text-right">
                    {currency.format(totalExpenseActual)}
                  </span>
                  <span
                    className={`text-right ${varianceColor(
                      totalExpenseActual - totalExpenseForecast,
                    )}`}
                  >
                    {formatSigned(totalExpenseActual - totalExpenseForecast)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
