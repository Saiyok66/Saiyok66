// ============================================================
// SQL Optimizer Dashboard - Express Server
// Serves frontend + provides /analyze and /optimize APIs
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const SQLAnalyzer = require('./backend/analyzer');
const SQLOptimizer = require('./backend/optimizer');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize engines
const analyzer = new SQLAnalyzer();
const optimizer = new SQLOptimizer();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// ---- API ROUTES ----

// POST /analyze - Analyze a SQL query for errors and suggestions
app.post('/analyze', (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a SQL query in the request body as { "query": "SELECT ..." }'
      });
    }

    const result = analyzer.analyze(query);

    return res.json({
      success: true,
      data: {
        errors: result.errors,
        suggestions: result.suggestions,
        explanation: result.explanation,
        score: result.score
      }
    });
  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during analysis.'
    });
  }
});

// POST /optimize - Optimize a SQL query
app.post('/optimize', (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a SQL query in the request body as { "query": "SELECT ..." }'
      });
    }

    const result = optimizer.optimize(query);

    return res.json({
      success: true,
      data: {
        original: result.original,
        optimized: result.optimized,
        changes: result.changes,
        improvementTips: result.improvementTips
      }
    });
  } catch (err) {
    console.error('Optimize error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during optimization.'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Fallback: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n====================================================`);
  console.log(`  SQL Optimizer Dashboard is running!`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`====================================================\n`);
});
