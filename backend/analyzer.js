// ============================================================
// SQL Query Analyzer Engine
// Detects errors, anti-patterns, and provides suggestions
// ============================================================

class SQLAnalyzer {
  constructor() {
    // Common SQL keywords for validation
    this.keywords = [
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
      'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL',
      'ON', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE',
      'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET',
      'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
      'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW',
      'INTO', 'VALUES', 'SET', 'NULL', 'IS', 'EXISTS',
      'UNION', 'ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
      'ASC', 'DESC', 'TOP', 'WITH', 'OVER', 'PARTITION',
      'FETCH', 'NEXT', 'ROWS', 'ONLY', 'CROSS', 'NATURAL'
    ];
  }

  analyze(query) {
    if (!query || query.trim().length === 0) {
      return {
        errors: ['Empty query provided. Please enter a SQL query.'],
        suggestions: [],
        explanation: 'No query to analyze.',
        score: 0
      };
    }

    const errors = this.detectErrors(query);
    const suggestions = this.detectAntiPatterns(query);
    const explanation = this.generateExplanation(query);
    const score = this.calculateScore(errors, suggestions);

    return { errors, suggestions, explanation, score };
  }

  detectErrors(query) {
    const errors = [];
    const upper = query.toUpperCase().trim();
    const trimmed = query.trim();

    // Check for missing semicolon
    if (!trimmed.endsWith(';')) {
      errors.push('Missing semicolon (;) at end of query.');
    }

    // Check for SELECT without FROM
    if (upper.includes('SELECT') && !upper.includes('FROM') && !upper.includes('SELECT 1') && !upper.includes('SELECT NOW')) {
      if (!upper.match(/SELECT\s+\w+\s*\(/)) {
        errors.push('SELECT statement appears to be missing a FROM clause.');
      }
    }

    // Check for unmatched parentheses
    const openParens = (query.match(/\(/g) || []).length;
    const closeParens = (query.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Unmatched parentheses: ${openParens} opening vs ${closeParens} closing.`);
    }

    // Check for unmatched quotes
    const singleQuotes = (query.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      errors.push('Unmatched single quote detected.');
    }

    // Check for double commas
    if (query.match(/,\s*,/)) {
      errors.push('Double comma detected — possible missing column or value.');
    }

    // Check for trailing comma before FROM
    if (upper.match(/,\s*FROM/)) {
      errors.push('Trailing comma before FROM clause.');
    }

    // Check for empty WHERE clause
    if (upper.match(/WHERE\s*(ORDER|GROUP|LIMIT|HAVING|;|\s*$)/)) {
      errors.push('WHERE clause appears to be empty.');
    }

    // Check for UPDATE without WHERE (dangerous)
    if (upper.includes('UPDATE') && upper.includes('SET') && !upper.includes('WHERE')) {
      errors.push('WARNING: UPDATE without WHERE clause will modify ALL rows!');
    }

    // Check for DELETE without WHERE (dangerous)
    if (upper.includes('DELETE') && upper.includes('FROM') && !upper.includes('WHERE')) {
      errors.push('WARNING: DELETE without WHERE clause will remove ALL rows!');
    }

    return errors;
  }

  detectAntiPatterns(query) {
    const suggestions = [];
    const upper = query.toUpperCase().trim();

    // SELECT * usage
    if (upper.match(/SELECT\s+\*/)) {
      suggestions.push({
        type: 'performance',
        message: 'Avoid SELECT * — specify only the columns you need to reduce data transfer and improve performance.',
        severity: 'high'
      });
    }

    // Missing WHERE on large table operations
    if (upper.includes('SELECT') && !upper.includes('WHERE') && !upper.includes('LIMIT')) {
      suggestions.push({
        type: 'performance',
        message: 'Consider adding a WHERE clause or LIMIT to prevent fetching all rows from the table.',
        severity: 'medium'
      });
    }

    // Using != instead of <>
    if (query.includes('!=')) {
      suggestions.push({
        type: 'standards',
        message: 'Consider using <> instead of != for SQL standard compliance.',
        severity: 'low'
      });
    }

    // LIKE with leading wildcard
    if (upper.match(/LIKE\s+'%/)) {
      suggestions.push({
        type: 'performance',
        message: 'Leading wildcard in LIKE (e.g., "%value") prevents index usage. Consider full-text search instead.',
        severity: 'high'
      });
    }

    // OR in WHERE (can prevent index use)
    if (upper.match(/WHERE.*\bOR\b/)) {
      suggestions.push({
        type: 'performance',
        message: 'Multiple OR conditions in WHERE may prevent index usage. Consider using IN() or UNION instead.',
        severity: 'medium'
      });
    }

    // Nested subqueries
    const subqueryCount = (upper.match(/SELECT/g) || []).length;
    if (subqueryCount > 2) {
      suggestions.push({
        type: 'readability',
        message: 'Multiple nested subqueries detected. Consider using Common Table Expressions (CTEs) with WITH clause.',
        severity: 'medium'
      });
    }

    // ORDER BY without LIMIT
    if (upper.includes('ORDER BY') && !upper.includes('LIMIT') && !upper.includes('TOP') && !upper.includes('FETCH')) {
      suggestions.push({
        type: 'performance',
        message: 'ORDER BY without LIMIT sorts the entire result set. Add LIMIT if you only need top results.',
        severity: 'low'
      });
    }

    // Using functions on indexed columns in WHERE
    if (upper.match(/WHERE\s+\w+\s*\(/)) {
      suggestions.push({
        type: 'performance',
        message: 'Using functions on columns in WHERE clause may prevent index usage. Consider computed columns.',
        severity: 'medium'
      });
    }

    // DISTINCT might indicate a JOIN issue
    if (upper.includes('DISTINCT')) {
      suggestions.push({
        type: 'design',
        message: 'DISTINCT may indicate duplicate rows from an incorrect JOIN. Review your JOIN conditions.',
        severity: 'low'
      });
    }

    // Not using table aliases with JOINs
    if (upper.includes('JOIN') && !upper.includes(' AS ') && !upper.match(/JOIN\s+\w+\s+\w+\s+ON/)) {
      suggestions.push({
        type: 'readability',
        message: 'Consider using table aliases (AS) with JOINs for better readability.',
        severity: 'low'
      });
    }

    return suggestions;
  }

  generateExplanation(query) {
    const upper = query.toUpperCase().trim();
    const parts = [];

    if (upper.includes('SELECT')) {
      const cols = upper.match(/SELECT\s+(.*?)\s+FROM/s);
      if (cols) {
        const colText = cols[1].trim() === '*' ? 'ALL columns' : `specific columns (${cols[1].trim()})`;
        parts.push(`This query SELECTS ${colText}`);
      } else {
        parts.push('This is a SELECT query');
      }
    } else if (upper.includes('INSERT')) {
      parts.push('This is an INSERT query that adds new rows');
    } else if (upper.includes('UPDATE')) {
      parts.push('This is an UPDATE query that modifies existing rows');
    } else if (upper.includes('DELETE')) {
      parts.push('This is a DELETE query that removes rows');
    } else if (upper.includes('CREATE')) {
      parts.push('This is a DDL (Data Definition) query that creates a database object');
    }

    const fromMatch = upper.match(/FROM\s+(\w+)/);
    if (fromMatch) {
      parts.push(`from the "${fromMatch[1]}" table`);
    }

    if (upper.includes('JOIN')) {
      const joinTypes = [];
      if (upper.includes('LEFT JOIN')) joinTypes.push('LEFT');
      if (upper.includes('RIGHT JOIN')) joinTypes.push('RIGHT');
      if (upper.includes('INNER JOIN')) joinTypes.push('INNER');
      if (upper.includes('FULL JOIN') || upper.includes('FULL OUTER')) joinTypes.push('FULL OUTER');
      if (upper.includes('CROSS JOIN')) joinTypes.push('CROSS');
      if (joinTypes.length === 0) joinTypes.push('INNER');
      parts.push(`with ${joinTypes.join(', ')} JOIN(s)`);
    }

    if (upper.includes('WHERE')) {
      parts.push('with filtering conditions (WHERE)');
    }

    if (upper.includes('GROUP BY')) {
      parts.push('with grouping (GROUP BY)');
    }

    if (upper.includes('HAVING')) {
      parts.push('with group-level filters (HAVING)');
    }

    if (upper.includes('ORDER BY')) {
      parts.push('with sorting (ORDER BY)');
    }

    if (upper.includes('LIMIT') || upper.includes('TOP')) {
      parts.push('with row limit');
    }

    if (parts.length === 0) {
      return 'Unable to determine query type. Please check your SQL syntax.';
    }

    return parts.join(' ') + '.';
  }

  calculateScore(errors, suggestions) {
    let score = 100;
    score -= errors.length * 15;
    suggestions.forEach(s => {
      if (s.severity === 'high') score -= 10;
      else if (s.severity === 'medium') score -= 5;
      else score -= 2;
    });
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = SQLAnalyzer;
