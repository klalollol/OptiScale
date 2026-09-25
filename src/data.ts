export type Stat = {
  label: string;
  value: string;
  detail: string;
};

export type PipelineStep = {
  id: string;
  title: string;
  accent: string;
  summary: string;
  deliverables: string[];
};

export type ImpactMetric = {
  title: string;
  value: string;
  description: string;
};

export const heroStats: Stat[] = [
  {
    label: 'Refactor Speed',
    value: '70%',
    detail: 'faster legacy modernization cycle',
  },
  {
    label: 'Parity Confidence',
    value: '100%',
    detail: 'business logic preserved in validation',
  },
  {
    label: 'Release Readiness',
    value: '3x',
    detail: 'faster deployment with containers and K8s',
  },
];

export const pipelineSteps: PipelineStep[] = [
  {
    id: '01',
    title: 'Document Understanding',
    accent: 'cyan',
    summary:
      'Read legacy system docs, architecture blueprints, and business rules to build a modernization map.',
    deliverables: ['Legacy system analysis', 'Target architecture mapping', 'Risk & dependency scan'],
  },
  {
    id: '02',
    title: 'Code Refactorer',
    accent: 'violet',
    summary:
      'Convert legacy Java 8 and outdated frameworks to Java 17 and Spring Boot 3 using guided transformations.',
    deliverables: ['Syntax modernization', 'Framework migration', 'Cloud-ready code structure'],
  },
  {
    id: '03',
    title: 'Parity Test Generator',
    accent: 'green',
    summary:
      'Generate input/output equivalence tests to confirm business behavior remains identical across versions.',
    deliverables: ['Regression suite', 'Golden test data', 'Behavior parity reports'],
  },
  {
    id: '04',
    title: 'CI/CD Deployer',
    accent: 'amber',
    summary:
      'Create Dockerfiles, Kubernetes manifests, and release pipelines for repeatable production deployments.',
    deliverables: ['Containerization', 'Kubernetes manifests', 'Deployment automation'],
  },
];

export const impactMetrics: ImpactMetric[] = [
  {
    title: 'Manual effort reduction',
    value: '−70%',
    description: 'Less time spent rewriting legacy code by hand and more focus on validation and governance.',
  },
  {
    title: 'Regression protection',
    value: '100%',
    description: 'Parity checks ensure business logic is preserved before release to production.',
  },
  {
    title: 'Cloud readiness',
    value: '24/7',
    description: 'Automated containers and release workflows keep the target platform continuously deployable.',
  },
];
