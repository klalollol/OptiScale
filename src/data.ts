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
  engineerHours: number;
};

export const businessImpact = {
  title: 'A cost case for one Java modernization project.',
  intro: 'Same project scope and acceptance criteria, with engineering review retained in both paths.',
  copy: {
    sectionLabel: 'Business impact / planning scenario',
    budgetSummary: 'Adjust budget inputs',
    budgetAside: 'See how the modeled percentage changes',
    budgetIntro: 'Use costs for the same project scope and quality gates. The opening $100/hour rate is an illustrative what-if input; Reset returns the $50/hour planning baseline. These are not measured customer savings.',
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
    oversizedValue: 'Choose smaller budget inputs; previous valid results are shown.',
    reduction: 'projected cost reduction',
    increase: 'modeled cost increase',
    equal: 'same modeled cost',
    savings: 'potential savings',
    higher: 'higher modeled cost',
    difference: 'difference',
    hoursCaveat: 'potentially saved · not a delivery-time guarantee',
    chartAria: 'Modeled total modernization cost in US dollars per project',
    chartTitle: 'Modeled project cost',
    optiScaleBase: 'OptiScale · base',
    scenarioAria: 'Potential savings by planning scenario',
    assumptionsLink: 'Assumptions & sources',
    detailsSummary: 'Cost model and research context',
    inputsHeading: 'Model inputs',
    scope: 'One Java 8 to Java 17 / Spring Boot 3 project, with equivalent work and quality gates.',
    workstreamsAria: 'Conventional to OptiScale base engineer-hours by workstream',
    formulaNote: 'Cost reduction = (conventional cost − scenario cost) ÷ conventional cost. The hourly rate, category hours, tools and CI/test budgets are planning inputs. The 120-hour baseline refactor estimate belongs to this separate Java planning scenario, not a timed customer project or the Python/FastAPI demo.',
    limits: 'Engineer-hours describe effort, not elapsed delivery time. Production cloud costs, observed customer savings, ROI and payback are outside this model.',
    researchHeading: 'Research context',
    researchIntro: "These sources inform the modernization scope and the range of uncertainty. None measures or proves OptiScale's projected percentages.",
  },
  conventional: { label: 'Conventional', engineerHours: 240 },
  scenarios: [
    { key: 'conservative', label: 'Conservative', engineerHours: 230 },
    { key: 'base', label: 'Base', engineerHours: 196 },
    { key: 'optimistic', label: 'Optimistic', engineerHours: 160 },
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
  disclaimer: 'Illustrative Java planning scenario · not measured customer results · excludes production cloud cost. This cost case is separate from the Python/FastAPI prototype above.',
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
  ],
};
