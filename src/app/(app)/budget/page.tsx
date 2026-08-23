import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profile";
import { getCurrentTournament } from "@/lib/tournament";
import {
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  updateBudgetItemActual,
  createBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory,
  copyBudgetFromTournament,
} from "./actions";
import { AmountInput } from "@/components/amount-input";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
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

function formatVariance(variance: number) {
  const sign = variance > 0 ? "+" : variance < 0 ? "-" : "";
  return `${sign}${currency.format(Math.abs(variance))}`;
}

export default async function BudgetPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const tournament = await getCurrentTournament();
  const isDirector = profile?.role === "director";

  const [{ data: rawItems }, { data: rawCategories }] = tournament
    ? await Promise.all([
        supabase
          .from("budget_items")
          .select("*")
          .eq("tournament_id", tournament.id)
          .order("category")
          .order("due_date"),
        supabase
          .from("budget_categories")
          .select("*")
          .eq("tournament_id", tournament.id)
          .order("name"),
      ])
    : [{ data: null }, { data: null }];

  const items = rawItems ?? [];
  const budgetCategories = rawCategories ?? [];

  let copySource: { id: string; year: number; name: string } | null = null;
  if (isDirector && tournament && items.length === 0) {
    const { data: otherTournaments } = await supabase
      .from("tournaments")
      .select("id, year, name")
      .neq("id", tournament.id)
      .order("year", { ascending: false });

    for (const t of otherTournaments ?? []) {
      const { count } = await supabase
        .from("budget_items")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", t.id);
      if (count && count > 0) {
        copySource = t;
        break;
      }
    }
  }

  const netSign = (item: (typeof items)[number]) => (item.is_revenue ? 1 : -1);
  const totalForecast = items.reduce(
    (sum, i) => sum + netSign(i) * i.forecasted_amount,
    0,
  );
  const totalActual = items.reduce(
    (sum, i) => sum + netSign(i) * (i.actual_amount ?? 0),
    0,
  );
  const totalVariance = totalActual - totalForecast;

  const revenueItems = items.filter((i) => i.is_revenue);
  const expenseItems = items.filter((i) => !i.is_revenue);
  const totalRevenueForecast = revenueItems.reduce(
    (sum, i) => sum + i.forecasted_amount,
    0,
  );
  const totalRevenueActual = revenueItems.reduce(
    (sum, i) => sum + (i.actual_amount ?? 0),
    0,
  );
  const totalExpenseForecast = expenseItems.reduce(
    (sum, i) => sum + i.forecasted_amount,
    0,
  );
  const totalExpenseActual = expenseItems.reduce(
    (sum, i) => sum + (i.actual_amount ?? 0),
    0,
  );

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">Budget</h1>
      <p className="mt-1 text-sm text-slate-500">
        Forecasted vs. actual by category.
      </p>

      <BudgetSubNav />

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments before tracking a
          budget.
        </p>
      )}

      {copySource && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm text-blue-900">
            This tournament has no budget yet. Copy the {copySource.year}{" "}
            budget (categories and forecasted amounts only — no actuals) as a
            starting point?
          </p>
          <form action={copyBudgetFromTournament.bind(null, copySource.id)}>
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Copy budget from {copySource.year}
            </button>
          </form>
        </div>
      )}

      {isDirector && tournament && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <CollapsibleDetails
            summary="+ Add Budget Item"
            summaryClassName="cursor-pointer text-sm font-semibold text-slate-900"
          >
            <form
              action={createBudgetItem}
              className="mt-4 grid grid-cols-2 gap-3"
            >
              <label className="text-sm text-slate-700">
                Category
                <select
                  name="category"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                >
                  <option value="">Select category…</option>
                  {budgetCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-700">
                Line item
                <input
                  name="line_item"
                  placeholder="Fairgrounds field rental"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Payee
                <input
                  name="payee"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Paid by
                <input
                  name="paid_by"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Date paid
                <input
                  name="due_date"
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Forecasted amount
                <input
                  name="forecasted_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm text-slate-700">
                Actual amount (optional)
                <input
                  name="actual_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-slate-700">
                <input type="checkbox" name="is_revenue" />
                Revenue (e.g. registration fees, merch commission)
              </label>
              <label className="col-span-2 text-sm text-slate-700">
                Notes
                <textarea
                  name="notes"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <button
                type="submit"
                className="col-span-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add budget item
              </button>
            </form>
          </CollapsibleDetails>
        </div>
      )}

      {isDirector && tournament && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <CollapsibleDetails
            summary="Manage Budget Categories"
            summaryClassName="cursor-pointer text-xs text-slate-400 hover:text-slate-600 hover:underline"
          >
            <div className="mt-3 space-y-2">
              {budgetCategories.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <form
                    action={updateBudgetCategory.bind(null, c.id)}
                    className="flex flex-1 items-center gap-2"
                  >
                    <input
                      name="name"
                      defaultValue={c.name}
                      required
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Save
                    </button>
                  </form>
                  <form action={deleteBudgetCategory.bind(null, c.id)}>
                    <ConfirmSubmitButton
                      confirmText={`Delete category "${c.name}"? Existing budget items keep their category text, but it will disappear from this list.`}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              ))}
              <form
                action={createBudgetCategory}
                className="flex items-center gap-2 pt-2"
              >
                <input
                  name="name"
                  placeholder="New category name"
                  required
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
                <button
                  type="submit"
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Add category
                </button>
              </form>
            </div>
          </CollapsibleDetails>
        </div>
      )}

      {tournament && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Forecast
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {currency.format(totalForecast)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Actual
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {currency.format(totalActual)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Variance
            </p>
            <p className={`mt-2 text-2xl font-semibold ${varianceColor(totalVariance)}`}>
              {formatVariance(totalVariance)}
            </p>
          </div>
        </div>
      )}

      {tournament && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>
      )}

      {tournament && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          {items.length ? (
            <div className="min-w-[820px] text-sm">
              <div className="grid grid-cols-[1fr_2fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-slate-100 px-5 py-2 text-left text-xs uppercase tracking-wide text-slate-400">
                <span>Category</span>
                <span>Item</span>
                <span>Payee</span>
                <span className="text-right">Forecast</span>
                <span className="text-right">Actual</span>
                <span className="text-right">Variance</span>
                <span />
              </div>
              <div className="divide-y divide-slate-50">
                {items.map((item) => {
                  const variance =
                    (item.actual_amount ?? 0) - item.forecasted_amount;
                  return (
                    <CollapsibleDetails
                      key={item.id}
                      summaryClassName="grid grid-cols-[1fr_2fr_1fr_0.8fr_0.8fr_0.8fr_auto] items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50"
                      summary={
                        <>
                          <span className="text-slate-500">
                            {item.category}
                          </span>
                          <span className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                            {item.line_item ?? "—"}
                            {item.is_revenue && (
                              <span className="ml-2 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                                Revenue
                              </span>
                            )}
                            {item.receipt_path && (
                              <a
                                href={`/budget/receipt/${item.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-2 text-xs font-normal text-blue-600 hover:underline"
                              >
                                Receipt
                              </a>
                            )}
                          </span>
                          <span className="text-slate-500">
                            {item.payee ?? "—"}
                          </span>
                          <span className="text-right text-slate-700">
                            {currency.format(item.forecasted_amount)}
                          </span>
                          <span className="text-right">
                            {isDirector ? (
                              <AmountInput
                                defaultValue={item.actual_amount}
                                action={updateBudgetItemActual.bind(
                                  null,
                                  item.id,
                                )}
                              />
                            ) : item.actual_amount != null ? (
                              currency.format(item.actual_amount)
                            ) : (
                              "—"
                            )}
                          </span>
                          <span
                            className={`text-right ${
                              item.actual_amount != null
                                ? varianceColor(variance)
                                : "text-slate-300"
                            }`}
                          >
                            {item.actual_amount != null
                              ? formatVariance(variance)
                              : "—"}
                          </span>
                          <span />
                        </>
                      }
                    >
                      {isDirector && (
                        <div className="border-t border-slate-100 px-5 py-4">
                          <form
                            action={updateBudgetItem.bind(null, item.id)}
                            className="grid grid-cols-2 gap-3"
                          >
                            <label className="text-sm text-slate-700">
                              Category
                              <select
                                name="category"
                                defaultValue={item.category}
                                required
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              >
                                <option value={item.category}>
                                  {item.category}
                                </option>
                                {budgetCategories
                                  .filter((c) => c.name !== item.category)
                                  .map((c) => (
                                    <option key={c.id} value={c.name}>
                                      {c.name}
                                    </option>
                                  ))}
                              </select>
                            </label>
                            <label className="text-sm text-slate-700">
                              Line item
                              <input
                                name="line_item"
                                defaultValue={item.line_item ?? ""}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="text-sm text-slate-700">
                              Payee
                              <input
                                name="payee"
                                defaultValue={item.payee ?? ""}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="text-sm text-slate-700">
                              Paid by
                              <input
                                name="paid_by"
                                defaultValue={item.paid_by ?? ""}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="text-sm text-slate-700">
                              Date paid
                              <input
                                name="due_date"
                                type="date"
                                defaultValue={item.due_date ?? ""}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="text-sm text-slate-700">
                              Forecasted amount
                              <input
                                name="forecasted_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={item.forecasted_amount}
                                required
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="text-sm text-slate-700">
                              Actual amount
                              <input
                                name="actual_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={item.actual_amount ?? ""}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <label className="flex items-center gap-1.5 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                name="is_revenue"
                                defaultChecked={item.is_revenue}
                              />
                              Revenue (e.g. registration fees, merch
                              commission)
                            </label>
                            <label className="text-sm text-slate-700">
                              Receipt
                              <input
                                name="receipt_file"
                                type="file"
                                accept="image/*,.pdf"
                                className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                              />
                              {item.receipt_path && (
                                <label className="mt-1 flex items-center gap-1.5 text-xs font-normal text-slate-500">
                                  <input
                                    type="checkbox"
                                    name="remove_receipt"
                                  />
                                  Remove current receipt
                                </label>
                              )}
                            </label>
                            <label className="col-span-2 text-sm text-slate-700">
                              Notes
                              <textarea
                                name="notes"
                                rows={2}
                                defaultValue={item.notes ?? ""}
                                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                              />
                            </label>
                            <button
                              type="submit"
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                            >
                              Save
                            </button>
                          </form>
                          <form
                            action={deleteBudgetItem.bind(null, item.id)}
                            className="mt-2"
                          >
                            <ConfirmSubmitButton
                              confirmText="Delete this budget item? This can't be undone."
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      )}
                    </CollapsibleDetails>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-slate-500">
              No budget items yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
