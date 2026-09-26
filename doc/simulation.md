# OptiScale Verification Harness — How It Works

A complete walkthrough of the simulation pipeline: from uploaded ZIP to a
measured performance comparison report, including anti-pattern detection and
fix hints.

---

## 1. Upload & Archive Safety

The user drops a `.zip` file onto the upload zone on **Page 2**.

Before a single byte is written to disk the archive is scanned for
path-traversal attacks (the *zip-slip* rule):

```
entries.find(e => e.path.includes('..') || e.path.startsWith('/'))
```

Any archive that fails this check is rejected immediately with a blocker.
The check runs entirely in the browser — no server round-trip.

---

## 2. Preflight

`runPreflight()` runs **client-side** against the `ArchiveEntry[]` list
(paths + sizes — no decompression needed for most checks).

### 2a. Facts extraction (`buildFacts`)

| Fact | How detected |
|---|---|
| `rootPrefix` | If all entries share one top-level folder and no root build file exists, that folder is the prefix and is stripped |
| `buildTool` | Looks for `pom.xml` → maven, `build.gradle.kts` → gradle-kotlin, `build.gradle` → gradle-groovy, `build.xml` → ant |
| `javaSourceVersion` | Reads the build file text: `maven.compiler.source`, `java.version`, `sourceCompatibility`, `JavaVersion.VERSION_17` |
| `springBootVersion` | Reads `<parent>` block in `pom.xml` |
| `javaFileCount` / `totalLoc` | Counts `.java` entries; LOC = non-blank lines summed across all Java files |
| `hasTests` | Any path starts with `src/test` |
| `hasDocs` | Any path is `docs` or starts with `docs/` |
| `hasDockerfile` | Root `Dockerfile` present |
| `moduleCount` | Number of build files found (> 1 = multi-module reactor) |

### 2b. Rules (8 checks)

```
blocker  → build-tool       no recognised build file at project root
blocker  → java-sources     zero .java files in archive
blocker  → zip-slip         unsafe entry path detected

warning  → existing-tests   no src/test directory
warning  → java-version     source level not declared in build file
warning  → dockerfile       no Dockerfile found
warning  → n-plus-one       FetchType.EAGER or bare @OneToMany in source
warning  → multi-module     more than one build file (multi-module reactor)

info     → docs             no docs/ folder (skip — not a blocker)
```

### 2c. Score & tier

```
score = (passing non-skip checks) / (total non-skip checks) × 100

tier:
  any blocker → 'unavailable'   review button stays disabled, pipeline stops
  ant build   → 'estimated'     static analysis only, no harness
  otherwise   → 'measured'      full harness eligible
```

The checklist renders live on **Page 2** (pass ✓ / warning ⚠ / blocker ✕ /
skip –). The **Review** button remains disabled until every blocker is resolved.

---

## 3. Static Analysis (always runs if no blockers)

Even without Docker, OptiScale derives *estimated* baseline metrics from the
source tree:

- LOC count and module topology from `ProjectFacts`
- N+1 risk from `FetchType.EAGER` / `@OneToMany` pattern scan
- Dependency lock file presence

These populate the perf table on **Page 3** with `source: "estimated"` badges
(amber outline). No number is fabricated — missing data yields `0 / estimated`.

---

## 4. Harness Injection (`injectHarness`)

Runs only when `tier === 'measured'` **and** Docker is available on the host.

### Step-by-step

```
1. hashTree(projectDir)
   SHA-256 of every file under the project root (excluding .modernization/)
   Written to .modernization/.tree-sha256

2. copyTemplate(templates/modernization/ → <project>/.modernization/)
   Every @PLACEHOLDER@ token is substituted:
     @LEGACY_GROUP@    →  detected Maven groupId
     @LEGACY_ARTIFACT@ →  detected artifactId
     @LEGACY_VERSION@  →  1.0.0-legacy
     @MODERN_VERSION@  →  1.0.0-modern
     @LEGACY_JAVA@     →  detected source version (default 8)
     @MODERN_JAVA@     →  17
     @SPRING_BOOT_VERSION@ → detected or 3.2.0

3. patchAggregator(projectDir)
   Backs up pom.xml → pom.xml.optiscale.bak   (append-only, never regenerated)
   Appends the bench module reference:
     <modules>
       <module>.modernization/bench</module>
     </modules>
```

**Contract**: the only pre-existing file that may be modified is the root
aggregator. Everything else is new files under `.modernization/`.

---

## 5. Benchmark Run (`run-bench.sh`)

```
┌─────────────────────────────────────────────────┐
│  run-bench.sh   (BENCH_TIMEOUT default: 900s)   │
└───────────────┬─────────────────────────────────┘
                │
        ┌───────▼────────┐
        │  1. Maven build │
        │   -Plegacy      │  → target/*-legacy.jar
        │   -Pmodern      │  → target/*-modern.jar
        └───────┬─────────┘
                │  exit 2 on failure → caller falls back to 'estimated'
        ┌───────▼──────────────┐
        │  2. Docker images     │
        │  Dockerfile.legacy    │  eclipse-temurin:8-jre-alpine,  non-root
        │  Dockerfile.modern    │  eclipse-temurin:17-jre-alpine, non-root
        └───────┬──────────────┘
                │
        ┌───────▼──────────────────────────────────┐
        │  3. docker compose up                     │
        │  db (postgres:16-alpine, healthcheck)     │
        │  legacy  port 18080   modern  port 18081  │
        │  network: internal (no egress)            │
        │  read_only + tmpfs /tmp                   │
        │  cap_drop: ALL, no-new-privileges         │
        │  pids_limit: 256, CPU 2.0, RAM 1G         │
        └───────┬──────────────────────────────────┘
                │
        ┌───────▼───────────────────────┐
        │  4. k6 load test (×2)         │
        │  grafana/k6  --network host   │
        │  ramping-vus: 1→10→50→0       │
        │  80s total per target         │
        │  → out/k6-legacy.json         │
        │  → out/k6-modern.json         │
        └───────┬───────────────────────┘
                │
        ┌───────▼──────────────────────────────────┐
        │  5. ParityIT (Testcontainers / JUnit 5)   │
        │  Replays every fixture in src/test/       │
        │  resources/fixtures/ against both         │
        │  containers.                              │
        │  Normalizer strips volatile fields        │
        │  (timestamp, traceId, requestId,          │
        │   durationMs) and rounds floats to        │
        │  9 significant digits before compare.     │
        │  → target/parity-report.json             │
        └───────┬──────────────────────────────────┘
                │
        ┌───────▼───────────────────────────┐
        │  6. JMH microbenchmarks            │
        │  LatencyBenchmark (legacy+modern)  │
        │  5 warmup + 10 measurement iters   │
        │  2 forks, -Xms/-Xmx 512m          │
        │  → out/jmh.json                   │
        └───────┬───────────────────────────┘
                │
        ┌───────▼──────────────────────────┐
        │  7. merge-report.mjs              │
        │  reads k6-*.json, jmh.json,       │
        │  parity-report.json, sql/*.log    │
        │  → out/report.json               │
        └───────┬──────────────────────────┘
                │
        ┌───────▼──────────────────────┐
        │  8. Image cleanup             │
        │  docker rmi legacy+modern     │
        └──────────────────────────────┘
```

p6spy intercepts every JDBC call during steps 3–5 and writes
`out/sql/sql.log` — the SQL statement count feeds `merge-report.mjs` as the
`sql` tool metric.

---

## 6. Report Merging (`merge-report.mjs`)

Reads four sources and emits one `MergeReportOutput` JSON object:

| Source file | Metrics extracted | source field |
|---|---|---|
| `out/k6-legacy.json` + `out/k6-modern.json` | p95, p99 latency; req/s throughput | `measured` if both present, else `estimated` |
| `out/jmh.json` | avg method time (ns) for legacy + modern benchmarks | `measured` if present |
| `out/sql/*.log` | statement count per container | `measured` if log files exist |
| `out/parity-report.json` | drift records (array of `ParityRecord`) | `measured` if present |

**Invariant**: if an input file is missing, the value is `0` and
`source: "estimated"`. A number is never fabricated.

---

## 7. Revert (always in `finally`)

```
revert(projectDir)
  1. mv pom.xml.optiscale.bak  →  pom.xml        (restores original aggregator)
  2. rm -rf .modernization/                       (removes all injected files)
  3. docker compose -p optiscale-bench down -v    (tears down containers)
  4. hashTree(projectDir)                         (recomputes SHA-256)
  5. assert actual === recorded                   (throws on mismatch)
```

Revert runs even on timeout or crash (bash `trap EXIT` in `run-bench.sh`,
`finally` block in the Node caller).

---

## 8. UI — Page 3 Results

After the pipeline completes, **Page 3** shows:

- **RequirementsPanel** — the same preflight checklist (score + tier pill +
  all check rows) so reviewers can see what gates were passed.
- **Performance table** — one row per metric:

| Column | Content |
|---|---|
| metric | human name, e.g. "p95 latency (ms)" |
| tool | `k6` / `jmh` / `sql` / `static` |
| legacy | measured or estimated value |
| modern | measured or estimated value |
| delta | `+X%` / `-X%` coloured green (improvement) or red (regression) |
| source | `measured` (cyan filled) or `estimated` (amber outline — never styled the same) |

The `estimated` badge is always visually distinct from `measured` — this is a
non-negotiable design contract enforced in `src/css/styles.css`.

---

## Sandbox Security Model

All uploaded code runs in throwaway Docker containers with:

```yaml
network:    internal: true          # no outbound internet access
read_only:  true                    # rootfs is immutable
tmpfs:      [/tmp]                  # only writable location
cap_drop:   [ALL]                   # no Linux capabilities
security_opt: [no-new-privileges:true]
pids_limit: 256
resources:
  limits: { cpus: "2.0", memory: 1G }
```

Images are deleted after every run. Each job gets its own container set.

---

## 9. Code Suggestion Engine (`src/lib/suggestions/`)

Runs **client-side in the browser** immediately after preflight, on any archive
that is not blocked. Does not require Docker or a build.

### 9a. What it scans

Every `.java` file in the archive is passed through 8 pattern detectors.
Each detector is a pure function `(src: string) => string | null` — it returns
the first matching code snippet or `null`.

### 9b. The 8 anti-patterns

| ID | Severity | Category | What is detected |
|---|---|---|---|
| `n-plus-one-eager` | **critical** | performance | `FetchType.EAGER` or bare `@OneToMany` without `fetch = FetchType.LAZY` |
| `blocking-http` | **critical** | performance | `new RestTemplate()` or `restTemplate.getForObject/exchange()` |
| `javax-imports` | **critical** | modernization | `import javax.persistence/servlet/validation.*` (Spring Boot 3 blocker) |
| `raw-thread-creation` | major | performance | `new Thread(` |
| `missing-transactional` | major | correctness | 2+ `repo.save()` calls in one method with no `@Transactional` |
| `http-session-state` | major | modernization | `HttpSession` attribute writes |
| `catch-raw-exception` | major | correctness | `catch (Exception e)` or `catch (Throwable e)` |
| `string-concat-loop` | minor | performance | `+=` string accumulation inside a `for` loop |

### 9c. Projected boost calculation

Each pattern carries an `estimatedImpact` range (min %, max %, target metric).
When a pattern is found in multiple files the range is scaled up by 20% per
additional hit, capped at 2×:

```
projectedBoostMin = pattern.min × (1 + (min(hitCount, 2) − 1) × 0.2)
projectedBoostMax = pattern.max × (1 + (min(hitCount, 2) − 1) × 0.2)
```

The **composite** projected improvement sums all *performance-category*
patterns and caps the result at **80%** — full additive compounding would be
unrealistic since patterns interact.

### 9d. Output shape (`SuggestionReport`)

```
{
  suggestions[]:           one entry per found pattern (sorted: critical → major → minor)
    pattern:               full AntiPattern definition (label, description, before/after code, fix steps)
    hits[]:                { file, line, snippet } for every matching file
    projectedBoostMin/Max: scaled range for this project
  totalPatterns:           distinct pattern types found
  totalHits:               total file locations flagged
  compositeBoostMin/Max:   aggregate performance projection
  generatedAt:             ISO timestamp
}
```

### 9e. Before / after code

Every pattern ships an illustrative `beforeCode` and `afterCode` snippet —
these are canonical examples of the transformation, **not** generated from the
actual uploaded file. They are shown verbatim in the UI using `escapeHtml()`
(assigned to `.innerHTML` via `<pre>` — no syntax spans, no XSS risk).

---

## 10. Suggestions Panel (UI — Page 3)

Rendered by `renderSuggestionsPanel()` in `src/pages/home/main.ts` from
`sampleSuggestions` in `src/data.ts`.

### Layout of each suggestion card

```
┌──────────────────────────────────────────────────────────────────┐
│  [critical] [performance]                ↑ 20–55% p95 latency  3 files │
│  N+1 query — eager collection fetch                              │
│  FetchType.EAGER causes Hibernate to issue one SELECT per…       │
│  ⌂ src/main/java/com/example/domain/Order.java                   │
│  ┌─────────────────────┬────────────────────────────────────┐   │
│  │ before              │ after                              │   │
│  │ @OneToMany(         │ @OneToMany(fetch = FetchType.LAZY) │   │
│  │   fetch=EAGER)      │ @Query("…JOIN FETCH…")             │   │
│  └─────────────────────┴────────────────────────────────────┘   │
│  1. Change FetchType.EAGER → FetchType.LAZY on @OneToMany.       │
│  2. Add @Query with JOIN FETCH in the repository method.         │
│  3. Run ParityIT to verify response parity after the change.     │
└──────────────────────────────────────────────────────────────────┘
```

### Severity colour coding

| Badge | Colour | Meaning |
|---|---|---|
| `critical` | red | Must fix — build blocker or major perf regression risk |
| `major` | amber | Should fix — correctness or significant perf impact |
| `minor` | muted | Nice to fix — small perf or code-quality improvement |

### Boost projection display

- Performance patterns → green `↑ MIN–MAX% metric`
- Correctness / reliability patterns → cyan `reliability fix` (no % claim)
- Composite banner at the top: `projected composite improvement: 35–75% p95 latency if all performance patterns are fixed`

The composite number is **never shown for correctness-only patterns** and is
always labelled as a projection, not a guarantee.
