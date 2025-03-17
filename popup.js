let lastApiCallSuccess = true;
let apiCallCount = 0;
const API_CALL_LIMIT = 10; // Safe threshold for free tier

// Cache for storing the last successful data
let cache = {
  currentPrice: null,
  hourlyChange: null,
  changePercent: null,
  changeClass: 'flat',
  lastSuccessTime: null,
  hasData: false
};

// Maximum age for cached data to be considered "fresh" (5 minutes in milliseconds)
const CACHE_FRESHNESS_THRESHOLD = 5 * 60 * 1000;

async function fetchBitcoinPrice() {
    try {
      // Update API status to "calling"
      updateApiStatus("warning", "calling");
      
      // Get current price
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      const currentPrice = data.bitcoin.usd;
      
      // Get hourly price change
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      const historyResponse = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${oneHourAgo}&to=${Math.floor(Date.now() / 1000)}`);
      
      if (!historyResponse.ok) {
        throw new Error(`API responded with status: ${historyResponse.status}`);
      }
      
      const historyData = await historyResponse.json();
      
      let hourlyChange = 0;
      let changePercent = 0;
      let changeClass = 'flat';
      
      if (historyData.prices && historyData.prices.length > 0) {
        const hourAgoPrice = historyData.prices[0][1];
        hourlyChange = currentPrice - hourAgoPrice;
        changePercent = (hourlyChange / hourAgoPrice) * 100;
        
        // Price is down - any decrease should be red
        if (hourlyChange < 0) {
          changeClass = 'down';
        } 
        // Price is up - any increase should be green
        else if (hourlyChange > 0) {
          changeClass = 'up';
        }
        // Price is exactly flat (extremely rare)
        else {
          changeClass = 'flat';
        }
      }
      
      // Update the UI with fresh data
      updateUI(currentPrice, hourlyChange, changePercent, changeClass, false);
      
      // Update cache with the newly fetched data
      updateCache(currentPrice, hourlyChange, changePercent, changeClass);
      
      // Track successful API call
      apiCallCount++;
      lastApiCallSuccess = true;
      
      // Update API status
      const apiStatus = apiCallCount >= API_CALL_LIMIT ? "warning" : "ok";
      const apiMessage = apiCallCount >= API_CALL_LIMIT ? 
          `ok (${apiCallCount}/${API_CALL_LIMIT})` : 
          `ok (${apiCallCount})`;
      updateApiStatus(apiStatus, apiMessage);
      
      // Update last fetch time display
      updateLastFetchTime(false);
      
      console.log("Popup updated:", {
        price: currentPrice,
        hourlyChange,
        changePercent,
        changeClass,
        apiCallCount,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      // Handle API errors
      console.error("API Error:", error);
      
      // Track failed API call
      lastApiCallSuccess = false;
      
      // Update API status to show error
      updateApiStatus("error", `error: ${error.message}`);
      
      // Use cached data if available
      if (cache.hasData) {
        console.log("Using cached data due to API error");
        
        // Update UI with cached data, marking it as using cache
        updateUI(
          cache.currentPrice, 
          cache.hourlyChange, 
          cache.changePercent, 
          cache.changeClass, 
          true
        );
        
        // Update last fetch time display with cached timestamp
        updateLastFetchTime(true);
      } else {
        // No cached data available
        document.getElementById('price').innerText = 'Error fetching price';
      }
    }
  }
  
  // Update the UI with price data
  function updateUI(currentPrice, hourlyChange, changePercent, changeClass, isFromCache) {
    // Update price display
    const priceElement = document.getElementById('price');
    if (priceElement) {
      if (currentPrice !== null) {
        priceElement.innerText = `$${currentPrice.toLocaleString()}`;
        if (isFromCache) {
          priceElement.innerText += ' (cached)';
        }
      } else {
        priceElement.innerText = 'No data available';
      }
    }
    
    // Update hourly change display
    const changeElement = document.getElementById('price-change');
    if (changeElement && hourlyChange !== null && changePercent !== null) {
      const sign = hourlyChange >= 0 ? '+' : '';
      changeElement.innerText = `${sign}$${hourlyChange.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
      changeElement.className = changeClass; // Set class directly
    }
  }
  
  // Update the cache with the latest successful data
  function updateCache(currentPrice, hourlyChange, changePercent, changeClass) {
    cache = {
      currentPrice,
      hourlyChange,
      changePercent,
      changeClass,
      lastSuccessTime: new Date(),
      hasData: true
    };
    
    // Also save to localStorage for persistence between popup opens
    try {
      localStorage.setItem('btcPriceCache', JSON.stringify(cache));
    } catch (e) {
      console.error("Failed to save cache to localStorage:", e);
    }
  }
  
  // Load cache from localStorage (if available)
  function loadCacheFromStorage() {
    try {
      const savedCache = localStorage.getItem('btcPriceCache');
      if (savedCache) {
        const parsedCache = JSON.parse(savedCache);
        // Convert string date back to Date object
        parsedCache.lastSuccessTime = parsedCache.lastSuccessTime ? new Date(parsedCache.lastSuccessTime) : null;
        cache = parsedCache;
        return true;
      }
    } catch (e) {
      console.error("Failed to load cache from localStorage:", e);
    }
    return false;
  }
  
  // Update API status indicator
  function updateApiStatus(status, message) {
    const apiStatusElement = document.getElementById('api-status');
    if (apiStatusElement) {
      const statusSpan = apiStatusElement.querySelector('span');
      if (statusSpan) {
        // Remove all classes
        statusSpan.classList.remove('ok', 'error', 'warning');
        // Add the current status class
        statusSpan.classList.add(status);
        // Update text
        statusSpan.textContent = message;
      }
    }
  }
  
  // Update the last fetch time display
  function updateLastFetchTime(isFromCache) {
    const fetchTimeElement = document.getElementById('last-fetch-time');
    if (fetchTimeElement && cache.lastSuccessTime) {
      const now = new Date();
      const fetchTime = cache.lastSuccessTime;
      const ageInMs = now - fetchTime;
      const isFresh = ageInMs < CACHE_FRESHNESS_THRESHOLD;
      
      // Format the time string
      const timeString = fetchTime.toLocaleTimeString();
      fetchTimeElement.textContent = `Last updated: ${timeString}`;
      
      // Add age indication if using cache
      if (isFromCache) {
        const ageMinutes = Math.floor(ageInMs / 60000);
        fetchTimeElement.textContent += ` (${ageMinutes} min old)`;
        
        // Add visual indicator if data is stale
        if (!isFresh) {
          fetchTimeElement.classList.add('stale');
        } else {
          fetchTimeElement.classList.remove('stale');
        }
      } else {
        fetchTimeElement.classList.remove('stale');
      }
    }
  }
  
  // Fetch price when the popup loads
  document.addEventListener('DOMContentLoaded', () => {
    // Try to load cached data from localStorage
    if (loadCacheFromStorage() && cache.hasData) {
      // Display cached data while waiting for fresh data
      updateUI(
        cache.currentPrice, 
        cache.hourlyChange, 
        cache.changePercent, 
        cache.changeClass, 
        true
      );
      updateLastFetchTime(true);
      console.log("Loaded initial data from cache");
    }
    
    // Initial setup
    updateApiStatus("ok", "ready");
    
    // Fetch fresh data
    fetchBitcoinPrice();
  });
  
  // Update price every 15 seconds (safer for API rate limits)
  setInterval(fetchBitcoinPrice, 15000);