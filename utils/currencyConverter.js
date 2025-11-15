// Currency converter utility
// Uses free API that works without authentication for basic conversion

const CURRENCY_CODES = {
  'KZT': 'Казахстанский тенге',
  'USD': 'Доллар США',
  'EUR': 'Евро',
  'RUB': 'Российский рубль',
  'GBP': 'Фунт стерлингов',
  'CNY': 'Китайский юань',
  'TRY': 'Турецкая лира',
  'GEL': 'Грузинский лари',
  'AMD': 'Армянский драм',
};

// Exchange rates (example rates - in production, fetch from API)
const EXCHANGE_RATES = {
  'USD': { 'KZT': 450, 'EUR': 0.92, 'RUB': 92, 'GBP': 0.79, 'CNY': 7.2, 'TRY': 32, 'GEL': 2.7, 'AMD': 400 },
  'EUR': { 'KZT': 490, 'USD': 1.09, 'RUB': 100, 'GBP': 0.86, 'CNY': 7.8, 'TRY': 35, 'GEL': 2.9, 'AMD': 435 },
  'KZT': { 'USD': 0.0022, 'EUR': 0.002, 'RUB': 0.2, 'GBP': 0.0018, 'CNY': 0.016, 'TRY': 0.071, 'GEL': 0.006, 'AMD': 0.89 },
  'RUB': { 'KZT': 4.9, 'USD': 0.011, 'EUR': 0.01, 'GBP': 0.0086, 'CNY': 0.078, 'TRY': 0.35, 'GEL': 0.029, 'AMD': 4.35 },
};

export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'USD') {
    return amount * (EXCHANGE_RATES.USD[toCurrency] || 1);
  }
  if (toCurrency === 'USD') {
    return amount / (EXCHANGE_RATES.USD[fromCurrency] || 1);
  }
  
  // Convert via USD
  const usdAmount = fromCurrency === 'USD' ? amount : amount / (EXCHANGE_RATES.USD[fromCurrency] || 1);
  return usdAmount * (EXCHANGE_RATES.USD[toCurrency] || 1);
};

export const getCurrencyName = (code) => CURRENCY_CODES[code] || code;

export const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const calculateExpenses = (items) => {
  return items.reduce((total, item) => {
    return total + (item.amount || 0);
  }, 0);
};

