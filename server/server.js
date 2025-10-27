require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5173;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static frontend
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'rawlins-trading-calculator', time: new Date().toISOString() });
});

// AI proxy endpoint
app.post('/api/ai', async (req, res) => {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY in environment' });
    }

    const { language, data } = req.body || {};

    // Create prompt similar to client version
    function createPrompt(d, lang) {
      const prompts = {
        en: `Analyze this trading strategy and provide professional insights:\n\nStarting Balance: $${d.startingBalance}\nTake Profit: ${d.takeProfit}%\nStop Loss: ${d.stopLoss}%\nWin Rate: ${d.winRate}%\nNumber of Trades: ${d.numberOfTrades}\nLeverage: ${d.leverage}x\nRisk/Reward Ratio: ${d.riskReward}\nFinal Balance: $${d.finalBalance}\nTotal P&L: $${d.totalPnL}\nNet Profit Rate: ${d.netProfitRate}%\n\nPlease provide a concise analysis covering: risk assessment, strategy viability, and key recommendations. Keep response under 400 words.`,
        tr: `Bu ticaret stratejisini analiz edin ve profesyonel görüşler sunun:\n\nBaşlangıç Bakiyesi: $${d.startingBalance}\nKar Al: ${d.takeProfit}%\nZarar Durdur: ${d.stopLoss}%\nKazanma Oranı: ${d.winRate}%\nİşlem Sayısı: ${d.numberOfTrades}\nKaldıraç: ${d.leverage}x\nRisk/Ödül Oranı: ${d.riskReward}\nSon Bakiye: $${d.finalBalance}\nToplam K/Z: $${d.totalPnL}\nNet Kar Oranı: ${d.netProfitRate}%\n\nLütfen risk değerlendirmesi, strateji uygulanabilirliği ve temel önerileri içeren özlü bir analiz sağlayın. 400 kelime altında tutun.`
      };
      return prompts[lang] || prompts.en;
    }

    const prompt = createPrompt(data || {}, language || 'en');

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'RAWLINS Trading Calculator',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(()=> '');
      return res.status(resp.status).json({ error: 'upstream_error', detail: txt });
    }

    const json = await resp.json();
    const message = json?.choices?.[0]?.message?.content || '';
    return res.json({ message });
  } catch (err) {
    console.error('AI proxy error:', err);
    return res.status(500).json({ error: 'proxy_failed' });
  }
});

// Fallback to index.html for static SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`RAWLINS server listening on http://localhost:${PORT}`);
});
