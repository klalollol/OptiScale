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

// ─── Preflight check display ──────────────────────────────────────────────────

export type PreflightCheckSeverity = 'blocker' | 'warning' | 'info';
export type PreflightCheckStatus   = 'pass' | 'fail' | 'skip';

export type PreflightCheckDisplay = {
  id: string;
  label: string;
  severity: PreflightCheckSeverity;
  status: PreflightCheckStatus;
  detail: string;
  remediation?: string;
};

export type PreflightPanelData = {
  score: number;
  tier: 'measured' | 'estimated' | 'unavailable';
  checks: PreflightCheckDisplay[];
};

export const samplePreflightPanel: PreflightPanelData = {
  score: 71,
  tier:  'measured',
  checks: [
    {
      id:       'build-tool',
      label:    'Build tool detected',
      severity: 'info',
      status:   'pass',
      detail:   'Detected maven.',
    },
    {
      id:       'java-sources',
      label:    'Java sources present',
      severity: 'info',
      status:   'pass',
      detail:   '312 files, 42,100 LOC.',
    },
    {
      id:       'zip-slip',
      label:    'Archive path safety',
      severity: 'info',
      status:   'pass',
      detail:   'No traversal or absolute paths.',
    },
    {
      id:          'existing-tests',
      label:       'Existing test sources',
      severity:    'warning',
      status:      'fail',
      detail:      'No src/test directory.',
      remediation: 'Parity fixtures will be recorded from live traffic instead of existing tests.',
    },
    {
      id:       'java-version',
      label:    'Source level declared',
      severity: 'info',
      status:   'pass',
      detail:   'Java 8 declared in build file.',
    },
    {
      id:          'dockerfile',
      label:       'Dockerfile present',
      severity:    'warning',
      status:      'fail',
      detail:      'No Dockerfile found.',
      remediation: 'Subagent 3 will generate one; baseline timing may differ from prod.',
    },
    {
      id:     'docs',
      label:  'Documentation folder',
      severity: 'info',
      status: 'skip',
      detail: 'No docs/ folder. Architecture intent inferred from code only.',
    },
    {
      id:       'n-plus-one',
      label:    'N+1 query risk',
      severity: 'info',
      status:   'pass',
      detail:   'No eager collection mappings detected.',
    },
    {
      id:       'multi-module',
      label:    'Module topology',
      severity: 'info',
      status:   'pass',
      detail:   'Single module.',
    },
  ],
};

// ─── Perf metric rows ─────────────────────────────────────────────────────────

export type MetricSource = 'measured' | 'estimated';

export type PerfMetricRow = {
  name: string;
  tool: string;
  legacyValue: number;
  modernValue: number;
  unit: string;
  deltaPercent: number;
  source: MetricSource;
};

export const samplePerfMetrics: PerfMetricRow[] = [
  {
    name:         'p95 latency (ms)',
    tool:         'k6',
    legacyValue:  342,
    modernValue:  187,
    unit:         'ms',
    deltaPercent: -45.32,
    source:       'measured',
  },
  {
    name:         'p99 latency (ms)',
    tool:         'k6',
    legacyValue:  890,
    modernValue:  410,
    unit:         'ms',
    deltaPercent: -53.93,
    source:       'measured',
  },
  {
    name:         'throughput (req/s)',
    tool:         'k6',
    legacyValue:  210,
    modernValue:  480,
    unit:         'req/s',
    deltaPercent: 128.57,
    source:       'measured',
  },
  {
    name:         'avg method time (ns)',
    tool:         'jmh',
    legacyValue:  1240,
    modernValue:  830,
    unit:         'ns',
    deltaPercent: -33.06,
    source:       'measured',
  },
  {
    name:         'SQL statements',
    tool:         'sql',
    legacyValue:  0,
    modernValue:  0,
    unit:         'statements',
    deltaPercent: 0,
    source:       'estimated',
  },
];

// ─── Code suggestion display ──────────────────────────────────────────────────

export type SuggestionSeverity = 'critical' | 'major' | 'minor';

export type SuggestionRow = {
  id: string;
  label: string;
  severity: SuggestionSeverity;
  category: string;
  description: string;
  /** Number of files where this pattern was found. */
  hitCount: number;
  /** Representative file path (first hit). */
  exampleFile: string;
  /** Illustrative legacy code (raw text). */
  beforeCode: string;
  /** Illustrative modern replacement (raw text). */
  afterCode: string;
  /** Fix steps shown under the card. */
  fixSteps: string[];
  /** Projected improvement range for this pattern. */
  boostMin: number;
  boostMax: number;
  boostMetric: string;
};

export type SuggestionPanelData = {
  rows: SuggestionRow[];
  /** Composite projected p95 latency improvement (perf patterns only, capped 80%). */
  compositeBoostMin: number;
  compositeBoostMax: number;
};

export const sampleSuggestions: SuggestionPanelData = {
  compositeBoostMin: 35,
  compositeBoostMax: 75,
  rows: [
    {
      id:          'n-plus-one-eager',
      label:       'N+1 query — eager collection fetch',
      severity:    'critical',
      category:    'performance',
      description: 'FetchType.EAGER on a collection causes Hibernate to issue one SELECT per parent row, exploding query counts under load.',
      hitCount:    3,
      exampleFile: 'src/main/java/com/example/domain/Order.java',
      beforeCode:  '@OneToMany(fetch = FetchType.EAGER)\nprivate List<OrderItem> items;',
      afterCode:   '@OneToMany(fetch = FetchType.LAZY)\nprivate List<OrderItem> items;\n\n// In repository:\n@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")\nOptional<Order> findWithItems(@Param("id") Long id);',
      fixSteps: [
        'Change FetchType.EAGER → FetchType.LAZY on the @OneToMany/@ManyToMany.',
        'Add a @Query with JOIN FETCH in the repository method that needs the collection.',
        'Run ParityIT to verify response parity after the change.',
      ],
      boostMin:    20,
      boostMax:    55,
      boostMetric: 'p95 latency',
    },
    {
      id:          'blocking-http',
      label:       'Blocking HTTP on request thread',
      severity:    'critical',
      category:    'performance',
      description: 'RestTemplate.getForObject() blocks the servlet thread during remote calls. Under concurrency this starves the thread pool.',
      hitCount:    2,
      exampleFile: 'src/main/java/com/example/service/PaymentService.java',
      beforeCode:  'RestTemplate rest = new RestTemplate();\nString result = rest.getForObject(url, String.class);',
      afterCode:   'WebClient client = WebClient.create();\nString result = client.get()\n  .uri(url)\n  .retrieve()\n  .bodyToMono(String.class)\n  .block();',
      fixSteps: [
        'Add spring-boot-starter-webflux to pom.xml.',
        'Replace RestTemplate bean with WebClient.Builder.',
        'Convert call sites to return Mono<T> or use .block() as a bridge.',
      ],
      boostMin:    30,
      boostMax:    70,
      boostMetric: 'throughput',
    },
    {
      id:          'javax-imports',
      label:       'javax.* imports (Spring Boot 2 → 3 blocker)',
      severity:    'critical',
      category:    'modernization',
      description: 'Spring Boot 3 renamed all javax.* packages to jakarta.*. Any remaining javax.persistence / javax.servlet import will fail to compile.',
      hitCount:    47,
      exampleFile: 'src/main/java/com/example/domain/Product.java',
      beforeCode:  'import javax.persistence.Entity;\nimport javax.servlet.http.HttpServletRequest;',
      afterCode:   'import jakarta.persistence.Entity;\nimport jakarta.servlet.http.HttpServletRequest;',
      fixSteps: [
        'Run: find src -name "*.java" | xargs sed -i "s/javax\\.persistence/jakarta.persistence/g"',
        'Repeat for javax.servlet → jakarta.servlet and javax.validation → jakarta.validation.',
        'Update pom.xml to Spring Boot 3.x parent.',
      ],
      boostMin:    100,
      boostMax:    100,
      boostMetric: 'build success',
    },
    {
      id:          'raw-thread-creation',
      label:       'Raw Thread instantiation',
      severity:    'major',
      category:    'performance',
      description: 'new Thread() bypasses thread-pool management and risks unbounded resource consumption. Use @Async or an ExecutorService.',
      hitCount:    1,
      exampleFile: 'src/main/java/com/example/service/NotificationService.java',
      beforeCode:  'new Thread(() -> sendEmail(user)).start();',
      afterCode:   '@Async\npublic CompletableFuture<Void> sendEmail(User user) { ... }',
      fixSteps: [
        'Add @EnableAsync to a @Configuration class.',
        'Annotate the async method with @Async.',
        'Return CompletableFuture<Void> so Spring can manage completion.',
      ],
      boostMin:    10,
      boostMax:    30,
      boostMetric: 'throughput',
    },
    {
      id:          'missing-transactional',
      label:       'Multi-step DB write without @Transactional',
      severity:    'major',
      category:    'correctness',
      description: 'Methods with multiple repository.save() calls without @Transactional leave the database partially updated on failure.',
      hitCount:    2,
      exampleFile: 'src/main/java/com/example/service/OrderService.java',
      beforeCode:  'public void placeOrder(Order order) {\n  orderRepo.save(order);\n  inventoryRepo.deduct(order);\n}',
      afterCode:   '@Transactional\npublic void placeOrder(Order order) {\n  orderRepo.save(order);\n  inventoryRepo.deduct(order);\n}',
      fixSteps: [
        'Add @Transactional to service methods that perform multiple writes.',
        'Ensure the method is called through the Spring proxy (not this.method()).',
        'Add @Transactional(readOnly = true) to read-only methods for performance.',
      ],
      boostMin:    0,
      boostMax:    0,
      boostMetric: 'reliability',
    },
  ],
};

export type HomeStep = {
  number: string;
  title: string;
  description: string;
};

export const homeSteps: HomeStep[] = [
  {
    number: '01',
    title: 'Choose a project',
    description: 'Select a Python/FastAPI project .ZIP, or pick a bundled demo on the upload screen.',
  },
  {
    number: '02',
    title: 'Read the finding',
    description: 'OptiScale looks for supported patterns in your source and reports possible performance bottlenecks.',
  },
  {
    number: '03',
    title: 'Review a suggestion',
    description: 'See why the pattern matters and inspect an illustrative before-and-after code proposal.',
  },
  {
    number: '04',
    title: 'Explore the comparison',
    description: 'Step through a simulated benchmark and review example before-and-after metrics.',
  },
];

export type HomeHighlight = {
  label: string;
  title: string;
  description: string;
};

export const homeHighlights: HomeHighlight[] = [
  {
    label: '01 / SOURCE SCAN',
    title: 'Potential bottlenecks',
    description: 'A browser-side scan checks for selected Python performance patterns. Treat each finding as a starting point for review, not a confirmed diagnosis.',
  },
  {
    label: '02 / CODE PROPOSAL',
    title: 'A change to consider',
    description: 'Compare before-and-after examples for the detected pattern. The app does not modify your uploaded project.',
  },
  {
    label: '03 / DEMO BENCHMARK',
    title: 'An example comparison',
    description: 'Explore preset metrics for the demo scenario. These figures are illustrative, not a measurement of your ZIP.',
  },
];
