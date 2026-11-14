import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  // Match inline code (`...`), bold (**...** or __...__), or italic (*...* or _..._)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[0.85em] text-[#3525CD] dark:text-[#C3C0FF]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (
      (token.startsWith('**') && token.endsWith('**')) ||
      (token.startsWith('__') && token.endsWith('__'))
    ) {
      tokens.push(
        <strong key={key++} className="font-semibold text-[#131B2E] dark:text-[#F1F5F9]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (
      (token.startsWith('*') && token.endsWith('*')) ||
      (token.startsWith('_') && token.endsWith('_'))
    ) {
      tokens.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim();
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  return inner.split('|').map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  const cells = parseTableRow(trimmed);
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre
          key={blockKey++}
          className="my-3 overflow-x-auto rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19] p-3.5 font-mono text-[13px] leading-relaxed text-[#131B2E] dark:text-[#F1F5F9]"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(
        <hr
          key={blockKey++}
          className="my-4 border-t border-[#E2E8F0] dark:border-[#1E293B]"
        />
      );
      i++;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const headingClasses: Record<number, string> = {
        1: 'text-xl font-semibold tracking-tight text-[#131B2E] dark:text-[#F1F5F9] mt-5 mb-2.5 first:mt-0',
        2: 'text-lg font-semibold tracking-tight text-[#131B2E] dark:text-[#F1F5F9] mt-4 mb-2 first:mt-0',
        3: 'text-base font-semibold text-[#131B2E] dark:text-[#F1F5F9] mt-3.5 mb-1.5 first:mt-0',
        4: 'text-sm font-semibold text-[#131B2E] dark:text-[#F1F5F9] mt-3 mb-1 first:mt-0',
      };
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4');
      elements.push(
        <Tag key={blockKey++} className={headingClasses[level]}>
          {renderInline(text)}
        </Tag>
      );
      i++;
      continue;
    }

    // GFM Table
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const headers = parseTableRow(line);
      const alignments = parseTableRow(lines[i + 1]).map((cell) => {
        if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
        if (cell.endsWith(':')) return 'right';
        return 'left';
      });
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim() !== '') {
        rows.push(parseTableRow(lines[i]));
        i++;
      }

      elements.push(
        <div
          key={blockKey++}
          className="my-4 overflow-x-auto rounded-lg border border-[#E2E8F0] dark:border-[#1E293B]"
        >
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-slate-50 dark:bg-[#0B0F19] border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    style={{ textAlign: alignments[idx] || 'left' }}
                    className="px-3.5 py-2.5 font-semibold text-[#131B2E] dark:text-[#F1F5F9] whitespace-nowrap"
                  >
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B] bg-white dark:bg-[#111827]">
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {headers.map((_, cIdx) => {
                    const cellVal = row[cIdx] ?? '';
                    const isNumeric = /^[\s$€£¥₹+-]*[\d,.]+%?$/.test(cellVal);
                    return (
                      <td
                        key={cIdx}
                        style={{ textAlign: alignments[cIdx] || 'left' }}
                        className={`px-3.5 py-2.5 text-[#464555] dark:text-slate-300 ${
                          isNumeric ? 'font-mono tabular-nums' : ''
                        }`}
                      >
                        {renderInline(cellVal)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Blockquote (hairline full border, no thick left bar)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={blockKey++}
          className="my-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0F19]/60 px-4 py-3 text-sm text-[#464555] dark:text-slate-300"
        >
          {renderInline(quoteLines.join(' '))}
        </blockquote>
      );
      continue;
    }

    // Unordered or ordered list
    if (/^(\s*)([-*+]|\d+\.)\s+/.test(line)) {
      const listItems: { indent: number; ordered: boolean; text: string }[] = [];
      while (i < lines.length && /^(\s*)([-*+]|\d+\.)\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
        if (m) {
          listItems.push({
            indent: Math.floor(m[1].length / 2),
            ordered: /^\d+\./.test(m[2]),
            text: m[3],
          });
        }
        i++;
      }
      const isOrdered = listItems[0]?.ordered;
      const ListTag = isOrdered ? 'ol' : 'ul';
      elements.push(
        <ListTag
          key={blockKey++}
          className={`my-2.5 space-y-1.5 pl-5 text-[14px] leading-relaxed text-[#464555] dark:text-slate-300 ${
            isOrdered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {listItems.map((item, idx) => (
            <li
              key={idx}
              style={{ marginLeft: `${Math.min(item.indent, 3) * 16}px` }}
            >
              {renderInline(item.text)}
            </li>
          ))}
        </ListTag>
      );
      continue;
    }

    // Paragraph (collect consecutive non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
      !/^(\s*)([-*+]|\d+\.)\s+/.test(lines[i]) &&
      !(lines[i].trim().includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      elements.push(
        <p
          key={blockKey++}
          className="my-2.5 first:mt-0 text-[14px] leading-[1.7] text-[#131B2E] dark:text-slate-200 max-w-[68ch]"
        >
          {renderInline(paraLines.join(' '))}
        </p>
      );
    }
  }

  return <div className="space-y-1">{elements}</div>;
};
