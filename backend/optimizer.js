// ============================================================
// SQL Query Optimizer Engine
// Rewrites and optimizes SQL queries for better performance
// ============================================================

class SQLOptimizer {
  optimize(query) {
    if (!query || query.trim().length === 0) {
      return {
        original: query,
        optimized: '',
        changes: ['No query provided.'],
        improvementTips: []
      };
    }

    let optimized = query.trim();
    const changes = [];
    const improvementTips = [];

    // 1. Replace SELECT * with explicit columns hint
    if (optimized.toUpperCase().match(/SELECT\s+\*/)) {
      optimized = optimized.replace(/SELECT\s+\*/i, 'SELECT /* specify columns: col1, col2, col3 */ *');
      changes.push('Flagged SELECT * — replace with specific column names for better performance.');
      improvementTips.push('List only the columns you actually need in your application.');
    }

    // 2. Add LIMIT if missing on SELECT without aggregation
    const upper = optimized.toUpperCase();
    if (upper.includes('SELECT') && !upper.includes('LIMIT') && !upper.includes('TOP') &&
        !upper.includes('COUNT(') && !upper.includes('SUM(') && !upper.includes('AVG(') &&
        !upper.includes('INSERT') && !upper.includes('UPDATE') && !upper.includes('DELETE') &&
        !upper.includes('CREATE') && !upper.includes('FETCH')) {
      const withoutSemicolon = optimized.replace(/;\s*$/, '');
      optimized = withoutSemicolon + '\nLIMIT 1000;';
      changes.push('Added LIMIT 1000 to prevent fetching unlimited rows.');
      improvementTips.push('Always use LIMIT in development to avoid loading entire tables.');
    }

    // 3. Replace != with <>
    if (optimized.includes('!=')) {
      optimized = optimized.replace(/!=/g, '<>');
      changes.push('Replaced != with <> for SQL standard compliance.');
    }

    // 4. Suggest index for WHERE columns
    const whereMatch = upper.match(/WHERE\s+(\w+)\s*(=|>|<|>=|<=|<>|LIKE|IN|BETWEEN)/);
    if (whereMatch) {
      const colName = whereMatch[1];
      if (colName !== 'AND' && colName !== 'OR' && colName !== 'NOT') {
        improvementTips.push(`Consider adding an index on column "${colName}" used in WHERE clause: CREATE INDEX idx_${colName.toLowerCase()} ON table_name(${colName});`);
      }
    }

    // 5. Optimize OR to IN
    const orPattern = /WHERE\s+(\w+)\s*=\s*'([^']+)'\s+OR\s+\1\s*=\s*'([^']+)'/i;
    const orMatch = optimized.match(orPattern);
    if (orMatch) {
      const col = orMatch[1];
      const val1 = orMatch[2];
      const val2 = orMatch[3];
      optimized = optimized.replace(orPattern, `WHERE ${col} IN ('${val1}', '${val2}')`);
      changes.push(`Converted OR conditions on "${col}" to IN() for better performance.`);
    }

    // 6. Format keywords to uppercase
    const keywordsToUpper = [
      'select', 'from', 'where', 'join', 'left join', 'right join',
      'inner join', 'full outer join', 'cross join', 'on', 'and', 'or',
      'order by', 'group by', 'having', 'limit', 'offset', 'insert into',
      'values', 'update', 'set', 'delete from', 'create table', 'alter table',
      'drop table', 'as', 'distinct', 'between', 'like', 'in', 'not',
      'is null', 'is not null', 'exists', 'union', 'union all',
      'case', 'when', 'then', 'else', 'end', 'asc', 'desc'
    ];

    keywordsToUpper.sort((a, b) => b.length - a.length);
    let formatted = optimized;
    keywordsToUpper.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, kw.toUpperCase());
    });

    // 7. Pretty-print: add newlines before major clauses
    formatted = formatted
      .replace(/\s+(FROM)\s+/gi, '\nFROM ')
      .replace(/\s+(WHERE)\s+/gi, '\nWHERE ')
      .replace(/\s+(ORDER BY)\s+/gi, '\nORDER BY ')
      .replace(/\s+(GROUP BY)\s+/gi, '\nGROUP BY ')
      .replace(/\s+(HAVING)\s+/gi, '\nHAVING ')
      .replace(/\s+(LEFT JOIN)\s+/gi, '\nLEFT JOIN ')
      .replace(/\s+(RIGHT JOIN)\s+/gi, '\nRIGHT JOIN ')
      .replace(/\s+(INNER JOIN)\s+/gi, '\nINNER JOIN ')
      .replace(/\s+(FULL OUTER JOIN)\s+/gi, '\nFULL OUTER JOIN ')
      .replace(/\s+(CROSS JOIN)\s+/gi, '\nCROSS JOIN ')
      .replace(/\s+(JOIN)\s+/gi, '\nJOIN ')
      .replace(/\s+(LIMIT)\s+/gi, '\nLIMIT ');

    if (formatted !== optimized) {
      changes.push('Formatted SQL keywords to uppercase and added line breaks for readability.');
    }

    optimized = formatted;

    // Ensure it ends with semicolon
    if (!optimized.trim().endsWith(';')) {
      optimized = optimized.trim() + ';';
    }

    if (changes.length === 0) {
      changes.push('Query looks good! No major optimizations needed.');
    }

    return {
      original: query.trim(),
      optimized: optimized.trim(),
      changes,
      improvementTips
    };
  }
}

module.exports = SQLOptimizer;
