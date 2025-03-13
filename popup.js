async function fetchBitcoinPrice() {
    try {
      // Get current price
      const currentResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const currentData = await currentResponse.json();
      const currentPrice = currentData.bitcoin.usd;
      
      // Get hourly price change
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      const historyResponse = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${oneHourAgo}&to=${Math.floor(Date.now() / 1000)}`);
      const historyData = await historyResponse.json();
      
      let hourlyChange = 0;
      let changePercent = 0;
      let changeClass = 'flat';
      
      if (historyData.prices && historyData.prices.length > 0) {
        const hourAgoPrice = historyData.prices[0][1];
        hourlyChange = currentPrice - hourAgoPrice;
        changePercent = (hourlyChange / hourAgoPrice) * 100;
        
        if (changePercent > 0.5) {
          changeClass = 'up';
        } else if (changePercent < -0.5) {
          changeClass = 'down';
        }
      }
      
      // Update price display
      document.getElementById('price').innerText = `$${currentPrice.toLocaleString()}`;
      
      // Update hourly change display
      const changeElement = document.getElementById('price-change');
      if (changeElement) {
        const sign = hourlyChange >= 0 ? '+' : '';
        changeElement.innerText = `${sign}$${hourlyChange.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
        changeElement.className = changeClass;
      }
    } catch (error) {
      document.getElementById('price').innerText = 'Error fetching price';
      console.error(error);
    }
  }
  
  // Fetch price when the popup loads
  fetchBitcoinPrice();
  
  // Update price every 30 seconds
  setInterval(fetchBitcoinPrice, 30000);