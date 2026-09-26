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
    description: 'OptiScale checks Python source for supported patterns such as repeated database queries and possible missing indexes.',
  },
  {
    number: '03',
    title: 'Review a suggestion',
    description: 'See why the pattern may matter and inspect an illustrative before-and-after code proposal.',
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
    description: 'A browser-side scan checks for selected Python performance patterns. Treat each finding as a starting point for review.',
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
