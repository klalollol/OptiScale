import http from 'k6/http';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const TARGET = __ENV.TARGET_URL;
const LABEL  = __ENV.TARGET_LABEL || 'unknown';

const fixtures = new SharedArray('requests', () =>
  JSON.parse(open('./requests.json')),
);

const latency  = new Trend(`latency_${LABEL}`, true);
const failures = new Counter(`failures_${LABEL}`);

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 50 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  const fx  = fixtures[Math.floor(Math.random() * fixtures.length)];
  const url = `${TARGET}${fx.path}`;
  const params = { headers: { 'Content-Type': 'application/json' } };

  const res =
    fx.method === 'GET'
      ? http.get(url, params)
      : http.request(fx.method, url, JSON.stringify(fx.body), params);

  latency.add(res.timings.duration);
  const ok = check(res, { 'status 2xx': (r) => r.status >= 200 && r.status < 300 });
  if (!ok) failures.add(1);
}

export function handleSummary(data) {
  return {
    [`/out/k6-${LABEL}.json`]: JSON.stringify(data, null, 2),
    stdout: `${LABEL}: p95=${data.metrics.http_req_duration.values['p(95)'].toFixed(1)}ms\n`,
  };
}
