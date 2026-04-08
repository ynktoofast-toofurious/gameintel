/**
 * Chat interface logic for the Agentic BI Portal.
 * Handles message rendering, form submission, sidebar, and mock AI.
 */
(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const messagesEl = $('#chatMessages');
  const welcomeEl = $('#welcomeScreen');
  const form = $('#chatForm');
  const input = $('#chatInput');
  const sendBtn = $('#sendBtn');
  const sidebar = $('#chatSidebar');
  const sidebarToggle = $('#sidebarToggle');
  const newChatBtn = $('#newChatBtn');
  const chatTitle = $('#chatTitle');
  const convItems = $$('.conv-item');
  const searchInput = $('#searchConversations');

  let messageCount = 0;

  // ----- Input management -----
  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim();
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.value.trim()) form.dispatchEvent(new Event('submit'));
    }
  });

  // ----- Form submission -----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    if (welcomeEl) welcomeEl.remove();

    addMessage('user', text);
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    if (messageCount === 1) {
      chatTitle.textContent = text.length > 40 ? text.slice(0, 40) + '…' : text;
    }

    showTypingIndicator();

    // Use LLM provider (Groq or Mock fallback)
    (async () => {
      try {
        const response = await LLMProvider.query(text);
        removeTypingIndicator();
        addAIMessage(response);
      } catch (err) {
        removeTypingIndicator();
        addAIMessage({
          source: 'error',
          title: 'Error',
          body: `Something went wrong: ${err.message}\n\nFalling back to demo mode.`,
          query: null,
          duration: null,
          provider: 'error'
        });
      }
    })();
  });

  // ----- Suggestion cards -----
  $$('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      input.value = card.dataset.prompt;
      input.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));
    });
  });

  // ----- Sidebar toggle -----
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // ----- New chat -----
  newChatBtn.addEventListener('click', () => {
    messagesEl.innerHTML = '';
    messagesEl.appendChild(createWelcomeScreen());
    chatTitle.textContent = 'New Conversation';
    messageCount = 0;
    convItems.forEach(c => c.classList.remove('active'));
  });

  // ----- Conversation switching -----
  convItems.forEach(item => {
    item.addEventListener('click', () => {
      convItems.forEach(c => c.classList.remove('active'));
      item.classList.add('active');
      chatTitle.textContent = item.querySelector('.conv-title').textContent;
      // On mobile, close sidebar after selection
      if (window.innerWidth <= 768) sidebar.classList.add('collapsed');
    });
  });

  // ----- Search conversations -----
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      convItems.forEach(item => {
        const title = item.querySelector('.conv-title').textContent.toLowerCase();
        item.style.display = title.includes(q) ? '' : 'none';
      });
    });
  }

  // ----- Message rendering -----
  function addMessage(role, text) {
    messageCount++;
    const msg = document.createElement('div');
    msg.className = `message ${role}`;

    const avatar = role === 'user' ? 'U' : 'AI';
    const sender = role === 'user' ? 'You' : 'Agentic BI';

    msg.innerHTML = `
      <div class="message-header">
        <div class="message-avatar">${avatar}</div>
        <span class="message-sender">${sender}</span>
      </div>
      <div class="message-body">${escapeHTML(text)}</div>
    `;
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  function addAIMessage(response) {
    messageCount++;
    const msg = document.createElement('div');
    msg.className = 'message assistant';

    let sourceTag = '';
    if (response.provider === 'gemini') {
      sourceTag = '<span class="meta-tag gemini">Gemini</span>';
    } else if (response.provider === 'groq') {
      sourceTag = '<span class="meta-tag groq">Groq</span>';
    } else if (response.source === 'power_bi') {
      sourceTag = '<span class="meta-tag pbi">Power BI</span>';
    } else if (response.source === 'snowflake') {
      sourceTag = '<span class="meta-tag snowflake">Snowflake</span>';
    } else {
      sourceTag = '<span class="meta-tag mock">Mock</span>';
    }

    const bodyHTML = markdownToHTML(response.body);

    const queryBlock = response.query
      ? `<details style="margin-top: 12px;">
          <summary style="cursor:pointer; color: var(--muted); font-size: 0.8rem;">View generated query</summary>
          <pre><code>${escapeHTML(response.query)}</code></pre>
        </details>`
      : '';

    const metaParts = [sourceTag];
    if (response.model) metaParts.push(`<span>${response.model}</span>`);
    if (response.duration) metaParts.push(`<span>${response.duration}ms</span>`);
    if (response.tokens) metaParts.push(`<span>${response.tokens} tokens</span>`);
    if (response.rows) metaParts.push(`<span>${response.rows} rows</span>`);
    if (response.validated) metaParts.push('<span>&#10003; Validated</span>');

    msg.innerHTML = `
      <div class="message-header">
        <div class="message-avatar">AI</div>
        <span class="message-sender">Agentic BI</span>
      </div>
      <div class="message-body">
        ${bodyHTML}
        ${queryBlock}
      </div>
      <div class="message-meta">
        ${metaParts.join('')}
      </div>
    `;
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  // ----- Typing indicator -----
  function showTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'message assistant';
    el.id = 'typingIndicator';
    el.innerHTML = `
      <div class="message-header">
        <div class="message-avatar">AI</div>
        <span class="message-sender">Agentic BI</span>
      </div>
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    `;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const el = $('#typingIndicator');
    if (el) el.remove();
  }

  // ----- Welcome screen (for new chat) -----
  function createWelcomeScreen() {
    const div = document.createElement('div');
    div.className = 'welcome-screen';
    div.id = 'welcomeScreen';
    div.innerHTML = `
      <div class="welcome-icon">
        <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#58a6ff" opacity="0.15"/><path d="M14 34V14l10 10 10-10v20" stroke="#58a6ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h2>GameIntel Chat</h2>
      <p>Ask questions about NBA stats, matchups, and standings. I'll query the data for you.</p>
      <div class="suggestion-grid">
        <button class="suggestion-card" data-prompt="Who are the top scorers in the NBA this season?">
          <span class="suggestion-icon">🏀</span>
          <span class="suggestion-label">Top Scorers</span>
          <span class="suggestion-desc">PPG leaders this season</span>
        </button>
        <button class="suggestion-card" data-prompt="Show me the current NBA standings by division">
          <span class="suggestion-icon">🏆</span>
          <span class="suggestion-label">Standings</span>
          <span class="suggestion-desc">Win/loss by division</span>
        </button>
        <button class="suggestion-card" data-prompt="Compare Luka Doncic vs Shai Gilgeous-Alexander stats">
          <span class="suggestion-icon">📊</span>
          <span class="suggestion-label">Player Compare</span>
          <span class="suggestion-desc">Head-to-head stat comparison</span>
        </button>
        <button class="suggestion-card" data-prompt="Show me the Celtics vs Cavaliers head to head matchup">
          <span class="suggestion-icon">🥊</span>
          <span class="suggestion-label">Matchups</span>
          <span class="suggestion-desc">Season series breakdown</span>
        </button>
      </div>
    `;
    // Re-attach suggestion listeners
    div.querySelectorAll('.suggestion-card').forEach(card => {
      card.addEventListener('click', () => {
        input.value = card.dataset.prompt;
        input.dispatchEvent(new Event('input'));
        form.dispatchEvent(new Event('submit'));
      });
    });
    return div;
  }

  // ----- Utilities -----
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function markdownToHTML(md) {
    let html = escapeHTML(md);
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Tables
    html = html.replace(/^(\|.+\|)\n(\|[-:| ]+\|)\n((?:\|.+\|\n?)+)/gm, (_, header, sep, body) => {
      const ths = header.split('|').filter(Boolean).map(h => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map(row => {
        const tds = row.split('|').filter(Boolean).map(d => `<td>${d.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table class="data-table"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><table/g, '<table').replace(/<\/table><\/p>/g, '</table>');
    return html;
  }

  // ----- Mobile: start with sidebar collapsed -----
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
  }

  // ----- LLM Settings button -----
  const llmSettingsBtn = $('#llmSettingsBtn');
  const llmDropdown = $('#llmDropdown');

  if (llmSettingsBtn) {
    llmSettingsBtn.addEventListener('click', () => {
      LLMProvider.showSettings();
      // When modal closes, re-sync dropdown in case keys changed
      const check = setInterval(() => {
        if (!document.getElementById('llmSettingsModal')) {
          clearInterval(check);
          syncDropdown();
        }
      }, 300);
    });
  }

  // Dropdown: instant provider switching
  if (llmDropdown) {
    llmDropdown.addEventListener('change', () => {
      const val = llmDropdown.value;
      const cfg = LLMProvider.getConfig();

      // If selecting a live provider without a key, prompt settings
      if (val === 'gemini' && !cfg.geminiKey) {
        LLMProvider.showSettings();
        llmDropdown.value = cfg.provider; // revert until key saved
        const check = setInterval(() => {
          if (!document.getElementById('llmSettingsModal')) {
            clearInterval(check);
            syncDropdown();
          }
        }, 300);
        return;
      }
      if (val === 'groq' && !cfg.groqKey) {
        LLMProvider.showSettings();
        llmDropdown.value = cfg.provider;
        const check = setInterval(() => {
          if (!document.getElementById('llmSettingsModal')) {
            clearInterval(check);
            syncDropdown();
          }
        }, 300);
        return;
      }

      LLMProvider.setProvider(val);
      syncDropdown();
    });
  }

  function syncDropdown() {
    const cfg = LLMProvider.getConfig();
    if (llmDropdown) {
      llmDropdown.value = cfg.provider;
      // Color the dropdown border by provider
      llmDropdown.className = 'llm-dropdown llm-dropdown--' + cfg.provider;
    }
    // Update sidebar status
    const name = LLMProvider.activeProviderName();
    const statusSpan = document.querySelector('.connection-status span:last-child');
    const statusDot = document.querySelector('.status-dot');
    if (statusSpan) statusSpan.textContent = name === 'Mock AI' ? 'GameIntel NBA · Mock Mode' : `GameIntel NBA · ${name}`;
    if (statusDot) statusDot.className = name === 'Mock AI' ? 'status-dot' : 'status-dot connected';
  }
  syncDropdown();
})();
