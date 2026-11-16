import { openDB, type IDBPDatabase } from 'idb';
import type { Trade, CapitalTransaction } from '../types/trading';

const DB_NAME = 'personal_trading_journal_db';
const DB_VERSION = 1;

interface TradingDBSchema {
  trades: {
    key: string;
    value: Trade;
    indexes: { 'by-date': string; 'by-status': string; 'by-symbol': string };
  };
  capital: {
    key: string;
    value: CapitalTransaction;
    indexes: { 'by-date': string };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('trades')) {
          const tradeStore = db.createObjectStore('trades', { keyPath: 'id' });
          tradeStore.createIndex('by-date', 'date');
          tradeStore.createIndex('by-status', 'status');
          tradeStore.createIndex('by-symbol', 'symbol');
        }
        if (!db.objectStoreNames.contains('capital')) {
          const capStore = db.createObjectStore('capital', { keyPath: 'id' });
          capStore.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// Trade CRUD
export async function getAllTrades(): Promise<Trade[]> {
  const db = await getDB();
  const trades = await db.getAll('trades');
  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveTrade(trade: Trade): Promise<void> {
  const db = await getDB();
  await db.put('trades', trade);
}

export async function deleteTrade(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('trades', id);
}

export async function bulkInsertTrades(trades: Trade[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('trades', 'readwrite');
  for (const trade of trades) {
    await tx.store.put(trade);
  }
  await tx.done;
}

// Capital Transactions CRUD
export async function getAllCapitalTransactions(): Promise<CapitalTransaction[]> {
  const db = await getDB();
  const list = await db.getAll('capital');
  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveCapitalTransaction(item: CapitalTransaction): Promise<void> {
  const db = await getDB();
  await db.put('capital', item);
}

export async function deleteCapitalTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('capital', id);
}

export async function bulkInsertCapital(items: CapitalTransaction[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('capital', 'readwrite');
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
}

// Full Database Backup & Restore
export async function exportDatabaseBackup(): Promise<string> {
  const trades = await getAllTrades();
  const capital = await getAllCapitalTransactions();
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    trades,
    capital,
  };
  return JSON.stringify(backup, null, 2);
}

export async function restoreDatabaseBackup(jsonData: string): Promise<{ tradeCount: number; capitalCount: number }> {
  const data = JSON.parse(jsonData);
  if (!data.trades || !Array.isArray(data.trades)) {
    throw new Error('Invalid backup file: missing trades data');
  }

  const db = await getDB();
  
  // Clear and restore trades
  const txTrades = db.transaction('trades', 'readwrite');
  await txTrades.store.clear();
  for (const t of data.trades) {
    await txTrades.store.put(t);
  }
  await txTrades.done;

  // Clear and restore capital
  let capitalCount = 0;
  if (data.capital && Array.isArray(data.capital)) {
    const txCap = db.transaction('capital', 'readwrite');
    await txCap.store.clear();
    for (const c of data.capital) {
      await txCap.store.put(c);
      capitalCount++;
    }
    await txCap.done;
  }

  return { tradeCount: data.trades.length, capitalCount };
}

// Clear all data
export async function clearAllLocalData(): Promise<void> {
  const db = await getDB();
  const tx1 = db.transaction('trades', 'readwrite');
  await tx1.store.clear();
  await tx1.done;

  const tx2 = db.transaction('capital', 'readwrite');
  await tx2.store.clear();
  await tx2.done;
}
