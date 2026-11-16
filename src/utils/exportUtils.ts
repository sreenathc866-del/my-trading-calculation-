import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Trade, CapitalTransaction } from '../types/trading';
import { calculateTradeMetrics, formatINR } from './calculations';

export function exportTradesToCSV(trades: Trade[]): void {
  const rows = trades.map((t) => {
    const m = calculateTradeMetrics(t);
    return {
      Date: t.date,
      'Asset Name': t.assetName,
      Symbol: t.symbol,
      Platform: t.platform,
      Type: t.tradeType,
      Status: t.status,
      'Buy Price': t.buyPrice,
      'Sell Price': t.sellPrice || '',
      Quantity: t.quantity,
      'Brokerage (INR)': t.brokerage,
      'Taxes & Charges (INR)': t.taxesAndCharges,
      'Total Charges (INR)': m.totalCharges,
      'Total Purchase Amount (INR)': m.totalPurchaseAmount,
      'Total Selling Amount (INR)': m.totalSellingAmount,
      'Gross P&L (INR)': m.grossPnL,
      'Net P&L (INR)': m.netPnL,
      'Unrealized P&L (INR)': m.unrealizedPnL,
      'Return %': `${m.returnPercentage.toFixed(2)}%`,
      Notes: t.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `Trading_Journal_${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportTradesToExcel(trades: Trade[], capital: CapitalTransaction[]): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Trades
  const tradeRows = trades.map((t) => {
    const m = calculateTradeMetrics(t);
    return {
      Date: t.date,
      'Asset Name': t.assetName,
      Symbol: t.symbol,
      Platform: t.platform,
      'Trade Type': t.tradeType,
      Status: t.status,
      'Buy Price': t.buyPrice,
      'Sell Price': t.sellPrice || 0,
      'Current Mkt Price': t.currentMarketPrice || '',
      Quantity: t.quantity,
      Brokerage: t.brokerage,
      'Taxes & Charges': t.taxesAndCharges,
      'Total Charges': m.totalCharges,
      'Total Purchase': m.totalPurchaseAmount,
      'Total Selling': m.totalSellingAmount,
      'Gross P&L': m.grossPnL,
      'Net P&L': m.netPnL,
      'Unrealized P&L': m.unrealizedPnL,
      'Return %': `${m.returnPercentage.toFixed(2)}%`,
      Notes: t.notes || '',
    };
  });
  const tradesSheet = XLSX.utils.json_to_sheet(tradeRows);
  XLSX.utils.book_append_sheet(workbook, tradesSheet, 'Trades');

  // Sheet 2: Capital
  const capitalRows = capital.map((c) => ({
    Date: c.date,
    Type: c.type,
    'Amount (INR)': c.amount,
    Platform: c.platform || '',
    Notes: c.notes || '',
  }));
  const capSheet = XLSX.utils.json_to_sheet(capitalRows);
  XLSX.utils.book_append_sheet(workbook, capSheet, 'Capital_History');

  XLSX.writeFile(workbook, `Trading_Portfolio_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportReportToPDF(
  title: string,
  periodSubtitle: string,
  summaryCards: { label: string; value: string }[],
  trades: Trade[]
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 40, 40);

  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`${periodSubtitle} | Generated on: ${new Date().toLocaleString('en-IN')}`, 40, 58);

  // Summary Cards grid
  let cardX = 40;
  let cardY = 80;
  doc.setFontSize(9);

  summaryCards.forEach((card, index) => {
    if (index > 0 && index % 4 === 0) {
      cardX = 40;
      cardY += 40;
    }
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, cardY, 175, 34, 4, 4, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cardX + 8, cardY + 14);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, cardX + 8, cardY + 28);
    doc.setFont('helvetica', 'normal');

    cardX += 185;
  });

  // Table
  const tableData = trades.map((t) => {
    const m = calculateTradeMetrics(t);
    return [
      t.date,
      t.symbol,
      t.tradeType,
      t.platform,
      t.status,
      formatINR(t.buyPrice),
      t.sellPrice ? formatINR(t.sellPrice) : '-',
      t.quantity.toString(),
      formatINR(m.totalCharges),
      t.status === 'Open' ? formatINR(m.unrealizedPnL) : formatINR(m.netPnL),
      `${m.returnPercentage.toFixed(2)}%`,
    ];
  });

  autoTable(doc, {
    startY: cardY + 50,
    head: [[
      'Date',
      'Symbol',
      'Type',
      'Platform',
      'Status',
      'Buy Price',
      'Sell Price',
      'Qty',
      'Charges',
      'Net P&L',
      'Return %',
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    didParseCell: (data) => {
      // Color Net P&L column
      if (data.section === 'body' && data.column.index === 9) {
        const text = data.cell.raw as string;
        if (text.startsWith('-')) {
          data.cell.styles.textColor = [220, 38, 38]; // Red
        } else if (text !== '₹0.00' && !text.startsWith('0')) {
          data.cell.styles.textColor = [22, 163, 74]; // Green
        }
      }
    },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
