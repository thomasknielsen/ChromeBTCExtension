// Background script to update the badge with Bitcoin price
let lastPrice = 0;
let lastHourPrice = 0;

// Function to fetch current Bitcoin price
async function fetchCurrentPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('Error fetching current price:', error);
    return null;
  }
}

// Function to fetch Bitcoin price from 1 hour ago
async function fetchHistoricalPrice() {
  try {
    // Get timestamp for 1 hour ago (in seconds)
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
    
    // CoinGecko API for historical data by timestamp
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${oneHourAgo}&to=${Math.floor(Date.now() / 1000)}`);
    const data = await response.json();
    
    // Get the first price point from the returned data (closest to 1 hour ago)
    if (data.prices && data.prices.length > 0) {
      return data.prices[0][1]; // Price from approx. 1 hour ago
    }
    return null;
  } catch (error) {
    console.error('Error fetching historical price:', error);
    return null;
  }
}

// Function to update badge with price and color
async function updateBadge() {
  const currentPrice = await fetchCurrentPrice();
  
  if (currentPrice) {
    // Store last known price
    lastPrice = currentPrice;
    
    // Get price from 1 hour ago
    if (!lastHourPrice) {
      lastHourPrice = await fetchHistoricalPrice() || currentPrice;
    }
    
    // Format the price for display on badge (shortened)
    // For example, 51,234 becomes 51K
    let displayPrice;
    if (currentPrice >= 10000) {
      displayPrice = Math.round(currentPrice / 1000) + 'K';
    } else {
      displayPrice = Math.round(currentPrice).toString();
    }
    
    // Set badge text
    chrome.action.setBadgeText({ text: displayPrice });
    
    // Determine badge color based on price change
    let badgeColor;
    
    // Price is down compared to an hour ago
    if (currentPrice < lastHourPrice) {
      badgeColor = '#F44336'; // Red
    }
    // Price is up more than 0.5% 
    else if (currentPrice > lastHourPrice * 1.005) {
      badgeColor = '#4CAF50'; // Green
    }
    // Price is flat (within ±0.5%)
    else {
      badgeColor = '#9E9E9E'; // Grey
    }
    
    // Set badge background color
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    
    console.log("Badge updated:", {
      price: currentPrice,
      display: displayPrice,
      color: badgeColor,
      lastHourPrice: lastHourPrice
    });
  }
}

// Initial update
updateBadge();

// Update every 5 minutes (300,000 milliseconds)
setInterval(updateBadge, 300000);

// Also update when the browser starts
chrome.runtime.onStartup.addListener(updateBadge);
