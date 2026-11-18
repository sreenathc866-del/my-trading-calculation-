import React, { useState } from 'react';
import type { Trade, CapitalTransaction } from '../types/trading';
import { exportTradesToCSV, exportTradesToExcel, exportReportToPDF } from '../utils/exportUtils';
import { exportDatabaseBackup, restoreDatabaseBackup, clearAllLocalData } from '../services/storageService';
import { Download, Upload, FileSpreadsheet, FileText, Database, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';
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
      a.download = `Tradelytics_Pro_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Full JSON database backup downloaded successfully.' });
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
          text: `Restored ${res.tradeCount} trades and ${res.capitalCount} capital records successfully!`,
        });
        onDataChanged();
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'Restore failed: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        'Warning: This permanently erases all locally stored trades and capital records. Download a JSON backup first. Proceed?'
      )
    ) {
      await clearAllLocalData();
      onDataChanged();
      setStatusMsg({ type: 'success', text: 'All local database records wiped.' });
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
    const netPnL = totalProfit - totalLoss;
    const winRate =
      closed.length > 0
        ? (closed.filter((t) => (t.sellPrice - t.buyPrice) * t.quantity - (t.brokerage + t.taxesAndCharges) > 0).length /
            closed.length) *
          100
        : 0;

    exportReportToPDF(
      'Trading Portfolio & Execution Audit Report',
      'Full History Report',
      [
        { label: 'Total Trades', value: trades.length.toString() },
        { label: 'Realized Profit', value: formatINR(totalProfit) },
        { label: 'Realized Loss', value: formatINR(totalLoss) },
        { label: 'Net Realized P&L', value: formatINR(netPnL) },
        { label: 'Win Rate', value: `${winRate.toFixed(1)}%` },
      ],
      trades
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-[#111726]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              Data Management & Reports
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Export institutional PDF audits, Excel ledgers, or create offline JSON backups
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {statusMsg && (
            <div
              className={`flex items-center gap-2 rounded-lg p-2.5 text-xs font-medium ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Export Formats */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Export Audit Reports
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={handlePDFExport}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-rose-500" />
                <span>PDF Audit Report</span>
              </button>

              <button
                onClick={() => exportTradesToExcel(trades, capital)}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                <span>Excel Spreadsheet</span>
              </button>

              <button
                onClick={() => exportTradesToCSV(trades)}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <Download className="h-4 w-4 text-blue-500" />
                <span>CSV Raw Ledger</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Offline Database Archive & Restore
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadJSON}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <Database className="h-4 w-4 text-emerald-500" />
                <span>Download JSON Backup</span>
              </button>

              <label className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-850 cursor-pointer">
                <Upload className="h-4 w-4 text-indigo-500" />
                <span>Restore JSON Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Reset Local Storage
                </span>
                <p className="text-[11px] text-zinc-400">
                  Wipe all trades and capital history from browser
                </p>
              </div>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Wipe Database</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
