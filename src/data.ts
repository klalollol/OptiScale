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
