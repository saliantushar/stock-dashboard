import { useEffect, useState } from "react";
import {
  Line
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale);

const STOCKS = ["AAPL", "TSLA", "MSFT", "NVDA"];
const API_KEY = "YOUR_FINNHUB_API_KEY";

export default function Dashboard() {
  const [prices, setPrices] = useState({});
  const [history, setHistory] = useState({});
  const [alerts, setAlerts] = useState({});

  useEffect(() => {
    const socket = new WebSocket(`wss://ws.finnhub.io?token=${API_KEY}`);

    socket.onopen = () => {
      STOCKS.forEach((stock) => {
        socket.send(JSON.stringify({ type: "subscribe", symbol: stock }));
      });
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "trade") {
        const updates = { ...prices };
        const hist = { ...history };

        data.data.forEach((trade) => {
          const symbol = trade.s;
          const price = trade.p;

          updates[symbol] = price;

          if (!hist[symbol]) hist[symbol] = [];
          hist[symbol] = [...hist[symbol].slice(-20), price];

          // ALERT CHECK
          if (alerts[symbol] && price >= alerts[symbol]) {
            alert(`🚨 ${symbol} hit ${price}`);
          }
        });

        setPrices(updates);
        setHistory(hist);
      }
    };

    return () => socket.close();
  }, [alerts]);

  const handleAlert = (stock, value) => {
    setAlerts({ ...alerts, [stock]: Number(value) });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 Live Stock Dashboard</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 20
      }}>
        {STOCKS.map((stock) => (
          <div key={stock} style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16
          }}>
            <h3>{stock}</h3>

            <h2>${prices[stock]?.toFixed(2) || "--"}</h2>

            {/* Chart */}
            <Line
              data={{
                labels: history[stock]?.map((_, i) => i) || [],
                datasets: [{
                  data: history[stock] || [],
                }]
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: { x: { display: false } }
              }}
            />

            {/* Alert Input */}
            <input
              type="number"
              placeholder="Set alert price"
              onChange={(e) => handleAlert(stock, e.target.value)}
              style={{ width: "100%", marginTop: 10 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
