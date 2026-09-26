export function pageShell(pageClass: string, content: string): string {
  return `<div class="page-shell flow-page ${pageClass}">
    <header class="topbar">
      <a class="logo-wrap" href="/" data-nav aria-label="OptiScale home"><span class="logo-diamond">◇</span><span class="logo-name">OptiScale</span></a>
      <nav class="flow-nav" aria-label="Main navigation"><a href="/" data-nav>Home</a></nav>
    </header>${content}</div>`;
}
