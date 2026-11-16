import React, { useState } from 'react';
import type { CapitalTransaction, CapitalTransactionType } from '../types/trading';
import { formatINR } from '../utils/calculations';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Trash2, ShieldAlert } from 'lucide-react';

interface CapitalManagerProps {
  transactions: CapitalTransaction[];
  availableCash: number;
  totalTradingCapital: number;
  totalDeposited: number;
  totalWithdrawn: number;
  currentInvestment: number;
  currentPortfolioValue: number;
  onAddTransaction: (tx: CapitalTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const CapitalManager: React.FC<CapitalManagerProps> = ({
  transactions,
  availableCash,
  totalTradingCapital,
  totalDeposited,
  totalWithdrawn,
  currentInvestment,
  currentPortfolioValue,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<CapitalTransactionType>('Deposit');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [platform, setPlatform] = useState<string>('Groww');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const newTx: CapitalTransaction = {
      id: 'cap_' + Date.now(),
      date,
      type,
      amount: Number(amount),
      platform,
      notes,
      createdAt: Date.now(),
    };

    onAddTransaction(newTx);
    setAmount('');
    setNotes('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>TOTAL DEPOSITED</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatINR(totalDeposited)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Net capital injected</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>TOTAL WITHDRAWN</span>
            <ArrowUpRight className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatINR(totalWithdrawn)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Withdrawn from account</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>AVAILABLE CASH</span>
            <Wallet className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatINR(availableCash)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Free unallocated balance</p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white p-5 shadow-xs dark:border-indigo-900/60 dark:from-slate-900 dark:to-indigo-950/20">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <span>TOTAL PORTFOLIO EQUITY</span>
            <span className="text-xs font-normal text-slate-400">Cash + Holdings</span>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-950 dark:text-indigo-200">
            {formatINR(currentPortfolioValue)}
          </div>
          <p className="mt-1 text-xs text-indigo-600/70 dark:text-indigo-400/80">
            Invested in Open: {formatINR(currentInvestment)}
          </p>
        </div>
      </div>

      {/* Rules / Note Alert */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
        <div>
          <span className="font-semibold">Accounting Rule Adherence:</span> Deposits are classified purely as injected capital and never counted as trading profit. Withdrawals are deductions from capital and never counted as trading losses. Trading profits/losses and charges are isolated in the trading journal.
        </div>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Capital Ledger & Deposits/Withdrawals
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep track of capital injections, initial funds, and payouts.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Close Form' : 'Add Capital Entry'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
        >
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Record Capital Entry
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Transaction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CapitalTransactionType)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Deposit">Deposit (Added Funds)</option>
                <option value="Withdrawal">Withdrawal (Taken Out)</option>
                <option value="Initial">Initial Capital</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Platform / Bank
              </label>
              <input
                type="text"
                placeholder="Groww / HDFC Bank"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly salary savings deposit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Save Transaction
            </button>
          </div>
        </form>
      )}

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Platform</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Notes</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No capital transactions yet. Add your initial deposit above.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          tx.type === 'Withdrawal'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                      {tx.platform || '-'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {tx.type === 'Withdrawal' ? '-' : '+'}
                      {formatINR(tx.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {tx.notes || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
