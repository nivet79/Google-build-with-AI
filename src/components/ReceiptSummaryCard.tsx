import React from 'react';
import { Receipt, AlertTriangle } from 'lucide-react';
import { ReceiptData } from '../types';

interface ReceiptSummaryCardProps {
  rawJson: string;
  onSwitchToRaw: () => void;
}

function formatMoney(amount: number | undefined, currency?: string): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '—';
  }
  const symbol =
    !currency || currency.toUpperCase() === 'USD'
      ? '$'
      : currency.toUpperCase() === 'EUR'
      ? '€'
      : currency.toUpperCase() === 'GBP'
      ? '£'
      : currency.toUpperCase() === 'INR'
      ? '₹'
      : currency.length <= 2
      ? currency
      : `${currency} `;

  return `${symbol}${amount.toFixed(2)}`;
}

export const ReceiptSummaryCard: React.FC<ReceiptSummaryCardProps> = ({
  rawJson,
  onSwitchToRaw,
}) => {
  let parsed: ReceiptData | null = null;
  let parseError = false;

  try {
    const obj = JSON.parse(rawJson);
    if (obj && typeof obj === 'object') {
      parsed = obj as ReceiptData;
    } else {
      parseError = true;
    }
  } catch {
    parseError = true;
  }

  if (parseError || !parsed) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#131B2E] dark:text-[#F1F5F9]">
              JSON syntax needs attention
            </h4>
            <p className="text-xs leading-relaxed text-[#464555] dark:text-slate-300">
              The current editor contents are not valid JSON, so the structured receipt summary cannot be rendered.
            </p>
            <button
              type="button"
              onClick={onSwitchToRaw}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] text-[#131B2E] dark:text-[#F1F5F9] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Open Raw / Edit View
            </button>
          </div>
        </div>
      </div>
    );
  }

  const lineItems = Array.isArray(parsed.lineItems) ? parsed.lineItems : [];
  const currency = parsed.currency || 'USD';

  return (
    <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1E293B] flex flex-wrap items-start justify-between gap-4 bg-slate-50/60 dark:bg-[#111827]">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] flex items-center justify-center shrink-0">
            <Receipt className="h-4 w-4 text-[#4F46E5] dark:text-[#818CF8]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#131B2E] dark:text-[#F1F5F9] truncate">
              {parsed.merchantName || 'Unknown Merchant'}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#464555] dark:text-slate-400 font-mono tabular-nums">
              <span>{parsed.date || 'Date not specified'}</span>
              <span aria-hidden="true">·</span>
              <span>{currency}</span>
              <span aria-hidden="true">·</span>
              <span>
                {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-[#464555] dark:text-slate-400">Total Amount</div>
          <div className="text-lg font-semibold font-mono tabular-nums text-[#131B2E] dark:text-[#F1F5F9]">
            {formatMoney(parsed.totalAmount, currency)}
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="border-b border-[#E2E8F0] dark:border-[#1E293B] text-xs text-[#464555] dark:text-slate-400">
            <tr>
              <th className="px-5 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium text-right">Qty</th>
              <th className="px-4 py-2.5 font-medium text-right">Unit Price</th>
              <th className="px-5 py-2.5 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
            {lineItems.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-6 text-center text-xs text-[#464555] dark:text-slate-400"
                >
                  No itemized line items detected on this receipt.
                </td>
              </tr>
            ) : (
              lineItems.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-5 py-2.5 font-medium text-[#131B2E] dark:text-[#F1F5F9]">
                    {item.description || 'Unnamed item'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[#464555] dark:text-slate-300">
                    {typeof item.quantity === 'number' ? item.quantity : '1'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[#464555] dark:text-slate-300">
                    {formatMoney(item.unitPrice, currency)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums font-medium text-[#131B2E] dark:text-[#F1F5F9]">
                    {formatMoney(item.total, currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Breakdown */}
      <div className="px-5 py-4 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50/40 dark:bg-[#111827]/70 flex flex-col items-end gap-1.5 text-[13px]">
        <div className="w-full max-w-[240px] flex items-center justify-between text-[#464555] dark:text-slate-400">
          <span>Subtotal</span>
          <span className="font-mono tabular-nums">
            {formatMoney(parsed.subtotal, currency)}
          </span>
        </div>
        <div className="w-full max-w-[240px] flex items-center justify-between text-[#464555] dark:text-slate-400">
          <span>Tax</span>
          <span className="font-mono tabular-nums">
            {formatMoney(parsed.tax, currency)}
          </span>
        </div>
        <div className="w-full max-w-[240px] pt-2 mt-1 border-t border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between font-semibold text-sm text-[#131B2E] dark:text-[#F1F5F9]">
          <span>Total</span>
          <span className="font-mono tabular-nums text-[#3525CD] dark:text-[#C3C0FF]">
            {formatMoney(parsed.totalAmount, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
