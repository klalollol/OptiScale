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
    title: 'Upload',
    description: 'Select a Python/FastAPI project .ZIP, or pick a bundled demo on the upload screen.',
  },
  {
    number: '02',
    title: 'Analyze',
    description: 'BOB scans the Python source for supported patterns such as repeated queries and possible missing indexes.',
  },
  {
    number: '03',
    title: 'Optimize',
    description: 'Review an illustrative before-and-after code proposal for the detected pattern. The app does not modify your files.',
  },
  {
    number: '04',
    title: 'Benchmark',
    description: 'Step through a simulated benchmark comparing the original and proposed versions under the same workload.',
  },
  {
    number: '05',
    title: 'Prove',
    description: 'See example before-and-after metrics — throughput, latency, CPU, and memory — for the demo scenario.',
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

export type ImpactScenario = {
  key: 'conservative' | 'base' | 'optimistic';
  label: string;
  projectCostUsd: number;
  engineerHours: number;
};

export const businessImpact = {
  sectionLabel: 'Business impact / separate planning scenario',
  title: 'A modeled cost case for Java modernization.',
  intro: 'A separate planning exercise for one Java 8 to Java 17 / Spring Boot 3 project. It is not a result from this Python optimization prototype.',
  copy: {
    budgetSummary: 'Adjust budget inputs',
    budgetAside: 'See how the modeled percentage changes',
    budgetIntro: 'Use costs for the same project scope and quality gates. The opening $100/hour rate is an illustrative what-if input; Reset returns to the $50/hour planning baseline. These are not measured customer savings.',
    engineeringRate: 'Engineering rate',
    conventionalCi: 'Conventional CI/test',
    optiScaleTools: 'OptiScale tools/AI',
    optiScaleCi: 'OptiScale CI/test',
    hourlyUnit: 'USD / hour',
    projectUnit: 'USD / project',
    budgetFormula: 'Conventional = 240 h × rate + CI/test. OptiScale = scenario hours × rate + tools/AI + CI/test. Scenario hours remain fixed at 230, 196 and 160 h.',
    reset: 'Reset example inputs',
    baseCase: 'Base case · one project',
    defaultState: 'Default planning inputs',
    customState: 'Your budget inputs · what-if estimate, not measured',
    invalidState: 'Fix the budget inputs; previous valid results are shown.',
    invalidValue: 'Enter a non-negative USD amount up to $1,000,000,000 in every field.',
    zeroBaseline: 'Conventional cost must be greater than $0 to calculate a percentage.',
    reduction: 'projected cost reduction',
    increase: 'modeled cost increase',
    equal: 'same modeled cost',
    savings: 'potential savings',
    higher: 'higher cost',
    difference: 'difference',
    chartAria: 'Modeled total modernization cost in US dollars per project',
    scenarioAria: 'Potential savings by planning scenario',
    inputsHeading: 'Cost model inputs',
    scope: 'One Java 8 to Java 17 / Spring Boot 3 project. Labour uses',
    workstreamsAria: 'Conventional to OptiScale base engineer-hours by workstream',
    formulaNote: 'The hourly rate, category hours, tools and CI/test budgets are planning inputs, not timed customer results.',
    limits: 'Engineer-hours describe effort, not elapsed delivery time. Production cloud costs, observed customer savings, ROI and payback are outside this model.',
  },
  baseLabel: 'Base case · one project',
  reductionLabel: 'projected cost reduction',
  savingsLabel: 'potential savings / project',
  hoursLabel: 'engineer-hours potentially saved',
  hoursCaveat: 'not a delivery-time guarantee',
  chartTitle: 'Modeled project cost',
  chartUnit: 'USD / project',
  labels: {
    costChart: 'Modeled total modernization cost in US dollars per project',
    optiScaleBase: 'OptiScale · base model',
    scaleLead: 'Bars share the same',
    scaleTail: 'scale.',
    scenarioList: 'Potential savings by planning scenario',
    scenarioSavings: 'potential savings',
    assumptionsLink: 'Assumptions & sources',
    detailsSummary: 'Cost model and research context',
    modelHeading: 'Model inputs',
    labourRate: 'Labour uses a planning rate of',
    workstreamList: 'Conventional to OptiScale base engineer-hours by workstream',
    conventional: 'Conventional',
    optiScale: 'OptiScale',
    projectCiTest: 'project CI/test',
    toolsAi: 'tools/AI',
    researchHeading: 'Research context',
  },
  modelScope: 'One Java 8 to Java 17 / Spring Boot 3 project, with equivalent work and quality gates.',
  modelCaveat: 'The hourly rate, category hours, tools and CI/test budgets are planning inputs. The 120-hour baseline refactor estimate comes from the demo scenario, not a timed customer project.',
  reductionFormula: 'Cost reduction = (conventional cost − scenario cost) ÷ conventional cost.',
  limitation: 'Engineer-hours describe effort, not elapsed delivery time. Production cloud costs, observed customer savings, ROI and payback are outside this model.',
  researchCaveat: "These sources inform the modernization scope and the range of uncertainty. None measures or proves OptiScale's projected percentages.",
  conventional: { label: 'Conventional', projectCostUsd: 12300, engineerHours: 240 },
  scenarios: [
    { key: 'conservative', label: 'Conservative', projectCostUsd: 12250, engineerHours: 230 },
    { key: 'base', label: 'Base', projectCostUsd: 10550, engineerHours: 196 },
    { key: 'optimistic', label: 'Optimistic', projectCostUsd: 8750, engineerHours: 160 },
  ] satisfies ImpactScenario[],
  hourlyRateUsd: 50,
  conventionalCiTestUsd: 300,
  optiScaleToolsUsd: 400,
  optiScaleCiTestUsd: 350,
  workstreams: [
    { label: 'Analysis, refactor & performance', conventionalHours: 120, baseHours: 84 },
    { label: 'QA & verification', conventionalHours: 60, baseHours: 54 },
    { label: 'Deployment preparation', conventionalHours: 20, baseHours: 16 },
    { label: 'Human review & rework', conventionalHours: 40, baseHours: 42 },
  ],
  disclaimer: 'Illustrative planning scenario · not measured customer results · excludes production cloud cost',
  sources: [
    { title: 'GAO legacy modernization report', url: 'https://files.gao.gov/reports/GAO-25-107795/index.html', context: 'Legacy IT context; not a per-project cost input.' },
    { title: 'Google: Migrating Code at Scale with LLMs', url: 'https://arxiv.org/abs/2504.09691', context: 'Migration case study; its time estimate is not an OptiScale result.' },
    { title: 'GitHub Copilot productivity experiment', url: 'https://arxiv.org/abs/2302.06590', context: 'Short coding task; not a Java modernization cost study.' },
    { title: 'METR developer productivity study', url: 'https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/', context: 'Counterexample showing AI assistance can add time.' },
    { title: 'Meta: Automated Unit Test Improvement', url: 'https://arxiv.org/abs/2402.09171', context: 'Testing assistance evidence; does not measure QA hours saved.' },
    { title: 'OpenRewrite Java 17 recipe', url: 'https://docs.openrewrite.org/recipes/java/migrate/upgradetojava17', context: 'Available migration automation; not a savings benchmark.' },
    { title: 'OpenRewrite Spring Boot 3 recipes', url: 'https://docs.openrewrite.org/recipes/java/spring/boot3', context: 'Available migration automation; not a savings benchmark.' },
    { title: 'Spring Boot 3 migration guide', url: 'https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide', context: 'Defines Java 17 and compatibility work in the project scope.' },
    { title: '2024 DORA report', url: 'https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report', context: 'Delivery and quality caution; not OptiScale validation.' },
    { title: 'AWS right-sizing guidance', url: 'https://docs.aws.amazon.com/whitepapers/latest/cost-optimization-right-sizing/cost-optimization-right-sizing.html', context: 'Cloud cost requires a separate workload-matched comparison.' },
  ],
};