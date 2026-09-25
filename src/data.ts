// ─── Subagent live status cards ───────────────────────────────────────────────

export type SubagentStatus = 'running' | 'verifying' | 'queued';

export type SubagentCard = {
  id: string;
  title: string;
  status: SubagentStatus;
  description: string;
  progressLabel: string;
  progressDone: number;
  progressTotal: number;
  progressUnit: string;
};

export const subagentCards: SubagentCard[] = [
  {
    id: '01 — refactorer',
    title: 'Code Refactorer',
    status: 'running',
    description:
      'Rewriting OrderService.java: javax.servlet → jakarta, XML bean config → annotations.',
    progressLabel: 'files',
    progressDone: 142,
    progressTotal: 220,
    progressUnit: 'files',
  },
  {
    id: '02 — parity tests',
    title: 'Parity Test Generator',
    status: 'verifying',
    description:
      'Replaying 1,204 production requests against legacy and modern endpoints, diffing responses byte for byte.',
    progressLabel: 'matched',
    progressDone: 975,
    progressTotal: 1204,
    progressUnit: 'matched',
  },
  {
    id: '03 — deployer',
    title: 'CI/CD Deployer',
    status: 'queued',
    description:
      'Waiting on parity sign-off before generating Dockerfile, Helm chart, and pipeline manifests.',
    progressLabel: 'manifests',
    progressDone: 2,
    progressTotal: 24,
    progressUnit: 'manifests',
  },
];

// ─── Code diff sample ─────────────────────────────────────────────────────────

export type CodeDiff = {
  label: string;
  legacy: string;
  modern: string;
  parityLine: string;
};

export const codeDiff: CodeDiff = {
  label: 'OrderService.calculateTotal()',
  legacy: `<span class="kw">public</span> <span class="ty">BigDecimal</span> <span class="fn">calculateTotal</span>(
    <span class="ty">List</span>&lt;<span class="ty">Item</span>&gt; items) {
  <span class="ty">BigDecimal</span> t = <span class="ty">BigDecimal</span>.ZERO;
  <span class="kw">for</span> (<span class="ty">Item</span> i : items) {
    t = t.add(i.getPrice()
      .multiply(<span class="kw">new</span> <span class="ty">BigDecimal</span>(
        i.getQty())));
  }
  <span class="kw">return</span> t;
}`,
  modern: `<span class="kw">public</span> <span class="ty">BigDecimal</span> <span class="fn">calculateTotal</span>(
    <span class="ty">List</span>&lt;<span class="ty">Item</span>&gt; items) {
  <span class="kw">return</span> items.stream()
    .map(i -&gt; i.price()
      .multiply(<span class="ty">BigDecimal</span>
        .valueOf(i.qty())))
    .reduce(<span class="ty">BigDecimal</span>.ZERO,
      <span class="ty">BigDecimal</span>::add);
}`,
  parityLine: '↳ 1,204 / 1,204 replayed requests — output parity 100%',
};

// ─── Footer stats ─────────────────────────────────────────────────────────────

export type FooterStat = {
  value: string;
  label: string;
};

export const footerStats: FooterStat[] = [
  { value: '312',  label: 'files refactored' },
  { value: '100%', label: 'parity on shipped services' },
  { value: '18',   label: 'k8s manifests generated' },
  { value: '6',    label: 'services in flight' },
];
