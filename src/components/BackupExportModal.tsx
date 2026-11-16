import React, { useState } from 'react';
import type { Trade, CapitalTransaction } from '../types/trading';
import { exportTradesToCSV, exportTradesToExcel, exportReportToPDF } from '../utils/exportUtils';
import { exportDatabaseBackup, restoreDatabaseBackup, clearAllLocalData } from '../services/storageService';
import { Download, Upload, FileSpreadsheet, FileText, Database, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { formatINR } from '../utils/calculations';

interface BackupExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  capital: CapitalTransaction[];
  onDataChanged: () => void;
}

export const BackupExportModal: React.FC<BackupExportModalProps> = ({
  isOpen,
  onClose,
  trades,
  capital,
  onDataChanged,
}) => {
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadJSON = async () => {
    try {
      const json = await exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Trading_Journal_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Complete JSON backup downloaded safely!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Backup failed: ' + err.message });
    }
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await restoreDatabaseBackup(text);
        setStatusMsg({
          type: 'success',
          text: `Successfully restored ${res.tradeCount} trades and ${res.capitalCount} capital entries!`,
        });
        onDataChanged();
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'Restore failed: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all trades and capital records permanently? Make sure to download a backup first!')) {
      await clearAllLocalData();
      onDataChanged();
      setStatusMsg({ type: 'success', text: 'All local records cleared.' });
    }
  };

  const handlePDFExport = () => {
    const closed = trades.filter((t) => t.status === 'Closed');
    const totalProfit = closed.reduce((acc, t) => {
      const p = (t.sellPrice - t.buyPrice) * t.quantity - (t.brokerage + t.taxesAndCharges);
      return p > 0 ? acc + p : acc;
    }, 0);
    const totalLoss = closed.reduce((acc, t) => {
      const p = (t.sellPrice - t.buyPrice) * t.quantity - (t.brokerage + t.taxesAndCharges);
      return p < 0 ? acc + Math.abs(p) : acc;
    }, 0);

    exportReportToPDF(
      'Trading Performance Statement',
      `Full Ledger (${trades.length} Trades)`,
      [
        { label: 'Total Trades', value: trades.length.toString() },
        { label: 'Realized Profit', value: formatINR(totalProfit) },
        { label: 'Realized Loss', value: formatINR(totalLoss) },
        { label: 'Net Realized P&L', value: formatINR(totalProfit - totalLoss) },
      ],
      trades
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Backup, Restore & Exports
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {statusMsg && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Export section */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Export Trading Reports
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => exportTradesToCSV(trades)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-200"
              >
                <FileText className="h-6 w-6 text-emerald-500" />
                <span className="text-sm font-medium">Export CSV</span>
                <span className="text-xs text-slate-400">Plain text data</span>
              </button>

              <button
                onClick={() => exportTradesToExcel(trades, capital)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-200"
              >
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">Export Excel</span>
                <span className="text-xs text-slate-400">Multi-sheet .xlsx</span>
              </button>

              <button
                onClick={handlePDFExport}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-4 transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-200"
              >
                <Download className="h-6 w-6 text-rose-500" />
                <span className="text-sm font-medium">Download PDF</span>
                <span className="text-xs text-slate-400">Formatted Report</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore section */}
          <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Offline Data Backup & Restore
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              All your records are stored in browser IndexedDB. Save a JSON backup file to prevent data loss if browser cache is cleared.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadJSON}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
              >
                <Download className="h-4 w-4" />
                Download JSON Backup
              </button>

              <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60 cursor-pointer">
                <Upload className="h-4 w-4" />
                Restore from Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Danger zone */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {trades.length} trades | {capital.length} capital transactions saved
            </span>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset All Local Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
