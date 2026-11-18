import React, { useState } from 'react';
import type { CapitalTransaction, CapitalTransactionType } from '../types/trading';
import { formatINR } from '../utils/calculations';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';

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

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-5">
      {/* Capital Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Total Deposited</span>
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="font-mono-num mt-1.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {formatINR(totalDeposited)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Total capital deployed</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Total Withdrawn</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="font-mono-num mt-1.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {formatINR(totalWithdrawn)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Net funds extracted</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Active Position Margin</span>
            <Wallet className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="font-mono-num mt-1.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {formatINR(currentInvestment)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Tied up in open stocks</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Available Cash Float</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="font-mono-num mt-1.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatINR(availableCash)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Free uncommitted balance</p>
        </div>
      </div>

      {/* Capital Inflow/Outflow Management Strip */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#111726]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Capital Transfer Ledger
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Record deposits, withdrawals, or starting account balances
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>{showForm ? 'Close Form' : 'Record Transfer'}</span>
          </button>
        </div>

        {/* Deposit/Withdrawal Entry Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CapitalTransactionType)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="Deposit">Deposit</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="Initial">Initial Capital</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 font-mono-num font-semibold dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 font-mono-num dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Broker / Bank
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="Groww">Groww</option>
                  <option value="Zerodha">Zerodha</option>
                  <option value="AngelOne">Angel One</option>
                  <option value="Upstox">Upstox</option>
                  <option value="Dhan">Dhan</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Salary transfer"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm Transfer
              </button>
            </div>
          </form>
        )}

        {/* Ledger Table */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Notes</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400">
                    No capital ledger entries recorded yet.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                    <td className="py-2.5 px-3 font-mono-num text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          tx.type === 'Deposit' || tx.type === 'Initial'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 font-medium">
                      {tx.platform}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400">
                      {tx.notes || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num font-bold text-zinc-900 dark:text-zinc-100">
                      {tx.type === 'Withdrawal' ? '-' : '+'}
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this capital record?')) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="rounded p-1 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
