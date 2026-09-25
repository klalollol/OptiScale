export function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

export function highlightCode(code: string): string {
  const tokens = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:public|private|protected|class|record|return|new|void|static|final|import|package|for|if|else|try|catch|throw|throws|extends|implements)\b|\b\d+(?:\.\d+)?\b|\b[A-Z][A-Za-z0-9_]*\b)/g;
  let end = 0;
  let html = '';
  for (const token of code.matchAll(tokens)) {
    const index = token.index;
    const value = token[0];
    html += escapeHtml(code.slice(end, index));
    const cls = value.startsWith('/') ? 'cm' : /^["']/.test(value) ? 'st'
      : /^\d/.test(value) ? 'nu' : /^[A-Z]/.test(value) ? 'ty' : 'kw';
    html += `<span class="${cls}">${escapeHtml(value)}</span>`;
    end = index + value.length;
  }
  return html + escapeHtml(code.slice(end));
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
