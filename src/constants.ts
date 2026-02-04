import type { Asset } from './types';

// Mock Data für Aktien (da keine kostenlose API)
export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK', price: 175.40, change24h: 0.5,
    change: { '15m': 0.1, '2h': 0.2, '4h': 0.3, '1d': 0.5, '1w': 1.2 },
    rsi: { '15m': 48, '2h': 50, '4h': 52, '1d': 55, '1w': 58 },
    macd: { '15m': { macd: 0.8, signal: 0.7, histogram: 0.1 }, '2h': { macd: 1.2, signal: 1.1, histogram: 0.1 }, '4h': { macd: 2.5, signal: 2.4, histogram: 0.1 }, '1d': { macd: 5.0, signal: 4.8, histogram: 0.2 }, '1w': { macd: 8.0, signal: 7.5, histogram: 0.5 } }
  },
  {
    id: 'tsla', symbol: 'TSLA', name: 'Tesla, Inc.', type: 'STOCK', price: 180.20, change24h: -3.4,
    change: { '15m': -0.5, '2h': -1.2, '4h': -2.1, '1d': -3.4, '1w': -5.8 },
    rsi: { '15m': 22, '2h': 25, '4h': 28, '1d': 32, '1w': 35 }, 
    macd: { '15m': { macd: -3, signal: -2, histogram: -1 }, '2h': { macd: -5, signal: -3, histogram: -2 }, '4h': { macd: -8, signal: -6, histogram: -2 }, '1d': { macd: -12, signal: -10, histogram: -2 }, '1w': { macd: -15, signal: -12, histogram: -3 } }
  },
  {
    id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corp', type: 'STOCK', price: 880.10, change24h: 1.5,
    change: { '15m': 0.3, '2h': 0.6, '4h': 1.0, '1d': 1.5, '1w': 3.2 },
    rsi: { '15m': 58, '2h': 60, '4h': 65, '1d': 70, '1w': 72 },
    macd: { '15m': { macd: 7, signal: 5, histogram: 2 }, '2h': { macd: 10, signal: 8, histogram: 2 }, '4h': { macd: 15, signal: 12, histogram: 3 }, '1d': { macd: 25, signal: 20, histogram: 5 }, '1w': { macd: 35, signal: 28, histogram: 7 } }
  }
];

export const REQUIREMENTS = [
  { title: "Marktdaten-Anbieter", description: "Binance API (Krypto) ist integriert. Aktien benötigen API Key.", technicalDetails: "Kostenlose Aktien-APIs sind limitiert." },
  { title: "Backend-Service", description: "Node.js Server nötig für 24/7 Betrieb.", technicalDetails: "Der Browser schläft, wenn der Tab zu ist." }
];
