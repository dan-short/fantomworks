// Robust parser for a phpMyAdmin/MySQL SQL dump.
// Extracts INSERT rows as arrays of JS values (string | number | null),
// respecting single-quote strings and backslash escapes. No line-based
// assumptions — scans character by character so embedded newlines/commas
// inside string literals are handled correctly.

import { readFileSync } from 'node:fs'

// Parse one MySQL string literal starting at sql[i] === "'".
// Returns [decodedString, nextIndex].
function readString(sql, i) {
  // assumes sql[i] === "'"
  i++
  let out = ''
  while (i < sql.length) {
    const ch = sql[i]
    if (ch === '\\') {
      const n = sql[i + 1]
      switch (n) {
        case 'n': out += '\n'; break
        case 'r': out += '\r'; break
        case 't': out += '\t'; break
        case '0': out += '\0'; break
        case 'b': out += '\b'; break
        case 'Z': out += '\x1a'; break
        case '\\': out += '\\'; break
        case "'": out += "'"; break
        case '"': out += '"'; break
        default: out += n // e.g. \% \_ -> keep the char
      }
      i += 2
      continue
    }
    if (ch === "'") {
      // MySQL also allows '' as an escaped quote
      if (sql[i + 1] === "'") { out += "'"; i += 2; continue }
      return [out, i + 1]
    }
    out += ch
    i++
  }
  throw new Error('Unterminated string literal')
}

// Parse a single tuple starting at sql[i] === '('. Returns [values[], nextIndex].
function readTuple(sql, i) {
  // assumes sql[i] === '('
  i++
  const values = []
  while (i < sql.length) {
    // skip whitespace
    while (/\s/.test(sql[i])) i++
    const ch = sql[i]
    if (ch === ')') return [values, i + 1]
    if (ch === ',') { i++; continue }
    if (ch === "'") {
      const [s, ni] = readString(sql, i)
      values.push(s)
      i = ni
    } else {
      // literal token: number, NULL, or bareword until , or )
      let j = i
      while (j < sql.length && sql[j] !== ',' && sql[j] !== ')') j++
      const tok = sql.slice(i, j).trim()
      if (tok.toUpperCase() === 'NULL') values.push(null)
      else if (/^-?\d+(\.\d+)?$/.test(tok)) values.push(Number(tok))
      else values.push(tok) // hex 0x..., etc. — keep raw
      i = j
    }
  }
  throw new Error('Unterminated tuple')
}

// Returns { columns: string[], rows: any[][] } for the given table.
export function parseTable(sql, table) {
  const columns = []
  const rows = []
  const insertRe = new RegExp('INSERT INTO `' + table + '` \\(([^)]*)\\) VALUES', 'g')
  let m
  let firstColsCaptured = false
  while ((m = insertRe.exec(sql)) !== null) {
    if (!firstColsCaptured) {
      for (const c of m[1].split(',')) columns.push(c.trim().replace(/`/g, ''))
      firstColsCaptured = true
    }
    let i = m.index + m[0].length
    // read tuples separated by commas until we hit the terminating ';'
    while (i < sql.length) {
      while (/\s/.test(sql[i])) i++
      if (sql[i] === '(') {
        const [vals, ni] = readTuple(sql, i)
        rows.push(vals)
        i = ni
        while (/\s/.test(sql[i])) i++
        if (sql[i] === ',') { i++; continue }
        if (sql[i] === ';') break
      } else break
    }
  }
  return { columns, rows }
}

// CLI: validate row counts when run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2] ?? 'exports/fantomwo_call_log.sql'
  const sql = readFileSync(path, 'utf8')
  for (const t of [
    'Project_Submissions',
    'Project_Submissions_Archive',
    'Project_Desc',
    'ZipCodes',
  ]) {
    const { columns, rows } = parseTable(sql, t)
    console.log(`${t}: ${rows.length} rows, ${columns.length} columns`)
  }
}
