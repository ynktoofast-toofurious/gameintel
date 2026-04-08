/**
 * LLM Provider abstraction for Agentic BI Portal.
 * Supports: Mock AI (demo), Gemini (Google), Groq (Llama 3 / Mixtral).
 */
const LLMProvider = (() => {
  const STORAGE_KEY = 'abi_llm_config';

  const PROVIDERS = {
    mock:   { name: 'Mock AI',  requiresKey: false, color: 'mock' },
    gemini: { name: 'Gemini',   requiresKey: true,  color: 'gemini' },
    groq:   { name: 'Groq',     requiresKey: true,  color: 'groq' }
  };

  const GEMINI_MODELS = [
    { id: 'gemini-2.5-flash',       label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite',  label: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-2.5-pro',         label: 'Gemini 2.5 Pro' }
  ];

  const GROQ_MODELS = [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B (Fast)' },
    { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B' }
  ];

  const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

  const SYSTEM_PROMPT = `You are an expert NBA analytics assistant for the Agentic BI platform.
You have deep knowledge of NBA stats, standings, matchups, and player comparisons.
When answering, use markdown tables for structured data. Be concise and data-driven.
If asked about current season stats, provide plausible 2025-26 season data.
Always include a brief "Key Insight" at the end of data-heavy responses.
Format numbers to one decimal place for stats like PPG, RPG, APG.`;

  /* ---------- Config persistence ---------- */
  const DEFAULT_CFG = {
    provider: 'mock',
    geminiKey: '', geminiModel: GEMINI_MODELS[0].id,
    groqKey: '',   groqModel: GROQ_MODELS[0].id
  };

  function loadConfig() {
    try {
      return { ...DEFAULT_CFG, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch { return { ...DEFAULT_CFG }; }
  }

  function saveConfig(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function getConfig() { return loadConfig(); }

  /* ---------- Gemini API call ---------- */
  async function callGemini(userMessage) {
    const cfg = loadConfig();
    const url = `${GEMINI_BASE}${cfg.geminiModel}:generateContent?key=${cfg.geminiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API error ${res.status}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokens = data.usageMetadata?.totalTokenCount || null;
    return { text, model: cfg.geminiModel, tokens, provider: 'gemini' };
  }

  /* ---------- Groq API call ---------- */
  async function callGroq(userMessage) {
    const cfg = loadConfig();
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.groqKey}`
      },
      body: JSON.stringify({
        model: cfg.groqModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq API error ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      provider: 'groq'
    };
  }

  /* ---------- Public query method ---------- */
  async function query(userMessage) {
    const cfg = loadConfig();

    if (cfg.provider === 'gemini' && cfg.geminiKey) {
      const result = await callGemini(userMessage);
      return {
        source: 'gemini',
        title: 'Gemini · ' + (GEMINI_MODELS.find(m => m.id === result.model)?.label || result.model),
        body: result.text,
        query: null,
        duration: null,
        tokens: result.tokens,
        model: result.model,
        provider: 'gemini'
      };
    }

    if (cfg.provider === 'groq' && cfg.groqKey) {
      const result = await callGroq(userMessage);
      return {
        source: 'groq',
        title: 'Groq · ' + (GROQ_MODELS.find(m => m.id === result.model)?.label || result.model),
        body: result.text,
        query: null,
        duration: result.usage ? Math.round(result.usage.total_tokens * 0.8) : null,
        tokens: result.usage?.total_tokens || null,
        model: result.model,
        provider: 'groq'
      };
    }

    // Fallback to MockAI
    const mock = MockAI.getResponse(userMessage);
    mock.provider = 'mock';
    return mock;
  }

  function isLive() {
    const cfg = loadConfig();
    if (cfg.provider === 'gemini') return !!cfg.geminiKey;
    if (cfg.provider === 'groq') return !!cfg.groqKey;
    return false;
  }

  function activeProviderName() {
    const cfg = loadConfig();
    const p = PROVIDERS[cfg.provider];
    return p ? p.name : 'Mock AI';
  }

  function activeModelLabel() {
    const cfg = loadConfig();
    if (cfg.provider === 'gemini') {
      const m = GEMINI_MODELS.find(m => m.id === cfg.geminiModel);
      return m ? m.label : cfg.geminiModel;
    }
    if (cfg.provider === 'groq') {
      const m = GROQ_MODELS.find(m => m.id === cfg.groqModel);
      return m ? m.label : cfg.groqModel;
    }
    return 'Demo';
  }

  /* ---------- Settings modal ---------- */
  function showSettings() {
    const existing = document.getElementById('llmSettingsModal');
    if (existing) existing.remove();

    const cfg = loadConfig();

    const overlay = document.createElement('div');
    overlay.id = 'llmSettingsModal';
    overlay.className = 'llm-settings-overlay';

    overlay.innerHTML = `
      <div class="llm-settings-panel">
        <div class="llm-settings-header">
          <h3>LLM Settings</h3>
          <button class="llm-settings-close" id="llmSettingsClose">&times;</button>
        </div>
        <div class="llm-settings-body">

          <!-- Gemini Section -->
          <div class="llm-provider-section">
            <div class="llm-provider-title"><span class="llm-dot gemini"></span> Gemini (Google)</div>
            <label class="llm-field-label">API Key</label>
            <input type="password" id="llmGeminiKey" class="llm-input" placeholder="AIza..." value="${cfg.geminiKey || ''}">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="llm-help-link">Get a free API key &rarr;</a>
            <label class="llm-field-label">Model</label>
            <select id="llmGeminiModel" class="llm-select">
              ${GEMINI_MODELS.map(m =>
                `<option value="${m.id}" ${cfg.geminiModel === m.id ? 'selected' : ''}>${m.label}</option>`
              ).join('')}
            </select>
          </div>

          <div class="llm-divider"></div>

          <!-- Groq Section -->
          <div class="llm-provider-section">
            <div class="llm-provider-title"><span class="llm-dot groq"></span> Groq</div>
            <label class="llm-field-label">API Key</label>
            <input type="password" id="llmGroqKey" class="llm-input" placeholder="gsk_..." value="${cfg.groqKey || ''}">
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener" class="llm-help-link">Get a free API key &rarr;</a>
            <label class="llm-field-label">Model</label>
            <select id="llmGroqModel" class="llm-select">
              ${GROQ_MODELS.map(m =>
                `<option value="${m.id}" ${cfg.groqModel === m.id ? 'selected' : ''}>${m.label}</option>`
              ).join('')}
            </select>
          </div>

          <div class="llm-settings-actions">
            <button id="llmTestBtn" class="btn btn-secondary llm-test-btn">Test Both</button>
            <button id="llmSaveBtn" class="btn btn-primary">Save Keys</button>
          </div>
          <div id="llmTestResult" class="llm-test-result"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('llmSettingsClose').addEventListener('click', () => overlay.remove());

    // Test both providers
    document.getElementById('llmTestBtn').addEventListener('click', async () => {
      const resultEl = document.getElementById('llmTestResult');
      const gemKey = document.getElementById('llmGeminiKey').value.trim();
      const groqKey = document.getElementById('llmGroqKey').value.trim();
      const results = [];

      resultEl.textContent = 'Testing…';
      resultEl.className = 'llm-test-result';

      // Test Gemini
      if (gemKey) {
        try {
          const model = document.getElementById('llmGeminiModel').value;
          const url = `${GEMINI_BASE}${model}:generateContent?key=${gemKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Say "OK"' }] }], generationConfig: { maxOutputTokens: 5 } })
          });
          results.push(res.ok ? `✓ Gemini (${model})` : `✗ Gemini: Error ${res.status}`);
        } catch (err) { results.push(`✗ Gemini: ${err.message}`); }
      } else {
        results.push('— Gemini: no key');
      }

      // Test Groq
      if (groqKey) {
        try {
          const model = document.getElementById('llmGroqModel').value;
          const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Say "OK"' }], max_tokens: 5 })
          });
          results.push(res.ok ? `✓ Groq (${model})` : `✗ Groq: Error ${res.status}`);
        } catch (err) { results.push(`✗ Groq: ${err.message}`); }
      } else {
        results.push('— Groq: no key');
      }

      resultEl.innerHTML = results.join('<br>');
      resultEl.className = 'llm-test-result ' + (results.every(r => r.startsWith('✓') || r.startsWith('—')) ? 'success' : 'error');
    });

    // Save
    document.getElementById('llmSaveBtn').addEventListener('click', () => {
      const newCfg = {
        ...loadConfig(),
        geminiKey: document.getElementById('llmGeminiKey').value.trim(),
        geminiModel: document.getElementById('llmGeminiModel').value,
        groqKey: document.getElementById('llmGroqKey').value.trim(),
        groqModel: document.getElementById('llmGroqModel').value
      };
      saveConfig(newCfg);
      overlay.remove();
    });
  }

  /* ---------- Quick provider switch (called from dropdown) ---------- */
  function setProvider(providerKey) {
    const cfg = loadConfig();
    cfg.provider = providerKey;
    saveConfig(cfg);
  }

  return {
    query,
    isLive,
    activeProviderName,
    activeModelLabel,
    getConfig,
    showSettings,
    setProvider,
    PROVIDERS,
    GEMINI_MODELS,
    GROQ_MODELS
  };
})();
