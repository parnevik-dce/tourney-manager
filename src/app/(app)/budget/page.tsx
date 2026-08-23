import { Fragment } from "react";
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
} from "./actions";
import { AmountInput } from "@/components/amount-input";
import { CollapsibleDetails } from "@/components/collapsible-details";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

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
          .order("created_at"),
        supabase
          .from("budget_categories")
          .select("*")
          .eq("tournament_id", tournament.id)
          .order("sort_order"),
      ])
    : [{ data: null }, { data: null }];

  const items = rawItems ?? [];
  const budgetCategories = rawCategories ?? [];

  const categories = new Map<string, typeof items>();
  for (const item of items) {
    const list = categories.get(item.category) ?? [];
    list.push(item);
    categories.set(item.category, list);
  }

  const totalForecast = items.reduce((sum, i) => sum + i.forecasted_amount, 0);
  const totalActual = items.reduce(
    (sum, i) => sum + (i.actual_amount ?? 0),
    0,
  );
  const totalVariance = totalActual - totalForecast;

  return (
    <div className="flex-1 px-8 py-8">
      <h1 className="font-display text-2xl font-bold text-slate-900">Budget</h1>
      <p className="mt-1 text-sm text-slate-500">
        Forecasted vs. actual by category.
      </p>

      {!tournament && (
        <p className="mt-6 text-sm text-amber-700">
          No active tournament — create one in Tournaments before tracking a
          budget.
        </p>
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
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
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
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          {items.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2 font-medium">Category / Item</th>
                  <th className="px-5 py-2 font-medium">Payee</th>
                  <th className="px-5 py-2 font-medium text-right">Forecast</th>
                  <th className="px-5 py-2 font-medium text-right">Actual</th>
                  <th className="px-5 py-2 font-medium text-right">Variance</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(categories.entries()).map(([category, catItems]) => {
                  const catForecast = catItems.reduce(
                    (s, i) => s + i.forecasted_amount,
                    0,
                  );
                  const catActual = catItems.reduce(
                    (s, i) => s + (i.actual_amount ?? 0),
                    0,
                  );
                  const catVariance = catActual - catForecast;

                  return (
                    <Fragment key={category}>
                      <tr className="border-b border-slate-100 bg-slate-50 font-medium text-slate-900">
                        <td className="px-5 py-2">{category}</td>
                        <td className="px-5 py-2"></td>
                        <td className="px-5 py-2 text-right">
                          {currency.format(catForecast)}
                        </td>
                        <td className="px-5 py-2 text-right">
                          {currency.format(catActual)}
                        </td>
                        <td
                          className={`px-5 py-2 text-right ${varianceColor(catVariance)}`}
                        >
                          {formatVariance(catVariance)}
                        </td>
                      </tr>
                      {catItems.map((item) => {
                        const variance = (item.actual_amount ?? 0) - item.forecasted_amount;
                        return (
                          <Fragment key={item.id}>
                            <tr className="border-b border-slate-50 text-slate-600">
                              <td className="px-5 py-2 pl-9">
                                {item.line_item ?? "—"}
                                {item.paid_by && (
                                  <span className="ml-2 text-xs text-slate-400">
                                    paid by {item.paid_by}
                                  </span>
                                )}
                                {item.due_date && (
                                  <span className="ml-2 text-xs text-slate-400">
                                    {item.due_date}
                                  </span>
                                )}
                                {item.receipt_path && (
                                  <a
                                    href={`/budget/receipt/${item.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-2 text-xs text-blue-600 hover:underline"
                                  >
                                    Receipt
                                  </a>
                                )}
                              </td>
                              <td className="px-5 py-2">{item.payee ?? "—"}</td>
                              <td className="px-5 py-2 text-right">
                                {currency.format(item.forecasted_amount)}
                              </td>
                              <td className="px-5 py-2 text-right">
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
                              </td>
                              <td
                                className={`px-5 py-2 text-right ${
                                  item.actual_amount != null
                                    ? varianceColor(variance)
                                    : "text-slate-300"
                                }`}
                              >
                                {item.actual_amount != null
                                  ? formatVariance(variance)
                                  : "—"}
                              </td>
                            </tr>
                            {isDirector && (
                              <tr className="border-b border-slate-50 last:border-0">
                                <td colSpan={5} className="px-5 pb-3 pl-9">
                                  <CollapsibleDetails
                                    summary="Edit"
                                    summaryClassName="cursor-pointer text-xs font-medium text-blue-600"
                                  >
                                    <form
                                      action={updateBudgetItem.bind(
                                        null,
                                        item.id,
                                      )}
                                      className="mt-3 grid grid-cols-2 gap-3"
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
                                          defaultValue={item.actual_amount ?? ""}
                                          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                                        />
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
                                      action={deleteBudgetItem.bind(
                                        null,
                                        item.id,
                                      )}
                                      className="mt-2"
                                    >
                                      <ConfirmSubmitButton
                                        confirmText={`Delete this budget item? This can't be undone.`}
                                        className="text-xs text-red-600 hover:underline"
                                      >
                                        Delete
                                      </ConfirmSubmitButton>
                                    </form>
                                  </CollapsibleDetails>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
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
