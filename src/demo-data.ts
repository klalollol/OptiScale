// ─── OptiScale Demo Data ──────────────────────────────────────────────────────
// All values are MOCK DATA for hackathon demonstration purposes.
// Replace with real API responses when backend is available.

export const projectData = {
  name: 'sample-fastapi-project',
  language: 'Python 3.11',
  framework: 'FastAPI',
  database: 'PostgreSQL',
  files: 126,
  dependencies: 47,
  sizeMB: 24.8,
};

export const analysisData = {
  status: 'complete' as const,
  filesAnalyzed: 126,
  dependencies: 47,
  patternsFound: 8,
  criticalBottlenecks: 1,
  bottleneck: {
    title: 'N+1 Database Query',
    severity: 'critical' as const,
    file: 'app/database.py',
    line: 42,
    impact: 'HIGH',
    description:
      'The application performs an additional database query for every user in the result set. As user count grows, database load scales linearly, increasing response time and reducing overall capacity.',
    codeBefore: `users = get_users()\n\nfor user in users:\n    user.orders = get_orders(user.id)`,
    pattern: 'N+1 query pattern',
    cause: 'Repeated database access inside a loop.',
    effect: 'Increased database operations as user count grows.',
  },
};

export const optimizationData = {
  type: 'Batch data retrieval',
  status: 'ready' as const,
  estimatedImpact: 'HIGH',
  file: 'app/database.py',
  linesAffected: '42–44',
  optimizationType: 'Database query optimization',
  risk: 'Low',
  codeBefore: `users = get_users()\n\nfor user in users:\n    user.orders = get_orders(user.id)`,
  codeAfter: `users = get_users_with_orders()`,
  description:
    'Retrieve related orders in a single database operation instead of issuing one query per user.',
  benefits: [
    '↓ Database queries',
    '↓ Database load',
    '↓ Response time',
    '↑ Throughput',
  ],
};

export const benchmarkData = {
  concurrentUsers: 1000,
  durationSeconds: 60,
  endpoint: 'GET /api/products',
  environment: 'Docker sandbox',
  database: 'PostgreSQL',
};

export const resultsData = {
  throughputBefore: 420,
  throughputAfter: 1081,
  latencyBefore: 238,
  latencyAfter: 91,
  cpuBefore: 91,
  cpuAfter: 63,
  memoryBefore: 1.8,
  memoryAfter: 1.3,
  multiplier: 2.57,
};
