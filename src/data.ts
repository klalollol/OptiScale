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
