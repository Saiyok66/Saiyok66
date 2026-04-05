// ============================================================
// SQL Optimizer Dashboard - Frontend JavaScript
// Handles UI interactions and API calls
// ============================================================

// API Base URL - change this when deploying backend
const API_BASE = window.location.origin;

// Sample queries for demo
const sampleQueries = [
  `SELECT * FROM employees WHERE department = 'Sales' OR department = 'Marketing' ORDER BY salary;`,
  `SELECT * FROM orders o, customers c WHERE o.customer_id = c.id AND o.status != 'cancelled';`,
  `SELECT DISTINCT name, email FROM users WHERE UPPER(name) LIKE '%john%' ORDER BY created_at;`,
  `SELECT * FROM products WHERE price > 100 AND category IN (SELECT category FROM featured_categories WHERE active = 1);`,
  `DELETE FROM logs;`,
  `UPDATE users SET status = 'inactive';`
];

let currentSampleIndex = 0;

// ---- Main Functions ----

async function analyzeQuery() {
  const query = document.getElementById('sqlInput').value.trim();
  if (!query) {
    alert('Please enter a SQL query first!');
    return;
  }

  showLoading(true);
  hideAllPanels();

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const result = await response.json();

    if (result.success) {
      displayAnalysis(result.data);
    } else {
      alert('Error: ' + (result.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Analyze failed:', err);
    alert('Could not connect to server. Make sure the backend is running on ' + API_BASE);
  } finally {
    showLoading(false);
  }
}

async function optimizeQuery() {
  const query = document.getElementById('sqlInput').value.trim();
  if (!query) {
    alert('Please enter a SQL query first!');
    return;
  }

  showLoading(true);
  hideAllPanels();

  try {
    // Run both analyze and optimize in parallel
    const [analyzeRes, optimizeRes] = await Promise.all([
      fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      }),
      fetch(`${API_BASE}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
    ]);

    const analyzeResult = await analyzeRes.json();
    const optimizeResult = await optimizeRes.json();

    if (analyzeResult.success) {
      displayAnalysis(analyzeResult.data);
    }

    if (optimizeResult.success) {
      displayOptimization(optimizeResult.data);
    }
  } catch (err) {
    console.error('Optimize failed:', err);
    alert('Could not connect to server. Make sure the backend is running on ' + API_BASE);
  } finally {
    showLoading(false);
  }
}

// ---- Display Functions ----

function displayAnalysis(data) {
  document.getElementById('emptyState').style.display = 'none';

  // Score
  if (typeof data.score === 'number') {
    const scoreSection = document.getElementById('scoreSection');
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreValue = document.getElementById('scoreValue');

    scoreValue.textContent = data.score;
    scoreCircle.className = 'score-circle';

    if (data.score >= 75) scoreCircle.classList.add('good');
    else if (data.score >= 40) scoreCircle.classList.add('ok');
    else scoreCircle.classList.add('bad');

    scoreSection.classList.add('visible');
  }

  // Errors
  if (data.errors && data.errors.length > 0) {
    const panel = document.getElementById('errorsPanel');
    const body = document.getElementById('errorsBody');
    body.innerHTML = data.errors.map(e =>
      `<div class="item">
        <span class="item-icon"></span>
        <span class="item-text">${escapeHtml(e)}</span>
      </div>`
    ).join('');
    panel.classList.add('visible');
  }

  // Suggestions
  if (data.suggestions && data.suggestions.length > 0) {
    const panel = document.getElementById('suggestionsPanel');
    const body = document.getElementById('suggestionsBody');
    body.innerHTML = data.suggestions.map(s =>
      `<div class="item">
        <span class="item-icon"></span>
        <span class="item-text">
          <span class="badge badge-${s.severity}">${s.severity}</span>
          <span class="badge badge-${s.severity === 'high' ? 'high' : 'low'}">${s.type}</span>
          ${escapeHtml(s.message)}
        </span>
      </div>`
    ).join('');
    panel.classList.add('visible');
  }

  // Explanation
  if (data.explanation) {
    const panel = document.getElementById('explanationPanel');
    const body = document.getElementById('explanationBody');
    body.innerHTML = `<p class="explanation-text">${escapeHtml(data.explanation)}</p>`;
    panel.classList.add('visible');
  }
}

function displayOptimization(data) {
  // Optimized Query
  if (data.optimized) {
    const panel = document.getElementById('optimizedPanel');
    const body = document.getElementById('optimizedBody');
    body.innerHTML = `
      <div class="code-block">
        <button class="copy-btn" onclick="copyToClipboard(this)"> Copy</button>
        <code>${escapeHtml(data.optimized)}</code>
      </div>`;
    panel.classList.add('visible');
  }

  // Changes
  if (data.changes && data.changes.length > 0) {
    const panel = document.getElementById('changesPanel');
    const body = document.getElementById('changesBody');
    body.innerHTML = data.changes.map(c =>
      `<div class="item">
        <span class="item-icon"></span>
        <span class="item-text">${escapeHtml(c)}</span>
      </div>`
    ).join('');
    panel.classList.add('visible');
  }

  // Improvement Tips
  if (data.improvementTips && data.improvementTips.length > 0) {
    const panel = document.getElementById('tipsPanel');
    const body = document.getElementById('tipsBody');
    body.innerHTML = data.improvementTips.map(t =>
      `<div class="item">
        <span class="item-icon"></span>
        <span class="item-text">${escapeHtml(t)}</span>
      </div>`
    ).join('');
    panel.classList.add('visible');
  }
}

// ---- Utility Functions ----

function loadSample() {
  const textarea = document.getElementById('sqlInput');
  textarea.value = sampleQueries[currentSampleIndex];
  currentSampleIndex = (currentSampleIndex + 1) % sampleQueries.length;
  textarea.focus();
}

function clearAll() {
  document.getElementById('sqlInput').value = '';
  hideAllPanels();
  document.getElementById('scoreSection').classList.remove('visible');
  document.getElementById('emptyState').style.display = 'block';
}

function hideAllPanels() {
  const panels = document.querySelectorAll('.panel');
  panels.forEach(p => p.classList.remove('visible'));
}

function showLoading(show) {
  const loading = document.getElementById('loading');
  const btnAnalyze = document.getElementById('btnAnalyze');
  const btnOptimize = document.getElementById('btnOptimize');

  if (show) {
    loading.classList.add('visible');
    btnAnalyze.disabled = true;
    btnOptimize.disabled = true;
  } else {
    loading.classList.remove('visible');
    btnAnalyze.disabled = false;
    btnOptimize.disabled = false;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyToClipboard(btn) {
  const codeBlock = btn.parentElement.querySelector('code');
  const text = codeBlock.textContent;

  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.textContent;
    btn.textContent = ' Copied!';
    setTimeout(() => { btn.textContent = originalText; }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    btn.textContent = ' Copied!';
    setTimeout(() => { btn.textContent = ' Copy'; }, 2000);
  });
}

// Keyboard shortcut: Ctrl+Enter to analyze
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    analyzeQuery();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
    e.preventDefault();
    optimizeQuery();
  }
});

// Log startup
console.log('SQL Optimizer Dashboard loaded. API endpoint:', API_BASE);
