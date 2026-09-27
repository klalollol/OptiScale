# OptiScale Verification Harness ΓÇö How It Works

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
The check runs entirely in the browser ΓÇö no server round-trip.

---

## 2. Preflight

`runPreflight()` runs **client-side** against the `ArchiveEntry[]` list
(paths + sizes ΓÇö no decompression needed for most checks).

### 2a. Facts extraction (`buildFacts`)

| Fact | How detected |
|---|---|
| `rootPrefix` | If all entries share one top-level folder and no root build file exists, that folder is the prefix and is stripped |
| `buildTool` | Looks for `pom.xml` ΓåÆ maven, `build.gradle.kts` ΓåÆ gradle-kotlin, `build.gradle` ΓåÆ gradle-groovy, `build.xml` ΓåÆ ant |
| `javaSourceVersion` | Reads the build file text: `maven.compiler.source`, `java.version`, `sourceCompatibility`, `JavaVersion.VERSION_17` |
| `springBootVersion` | Reads `<parent>` block in `pom.xml` |
| `javaFileCount` / `totalLoc` | Counts `.java` entries; LOC = non-blank lines summed across all Java files |
| `hasTests` | Any path starts with `src/test` |
| `hasDocs` | Any path is `docs` or starts with `docs/` |
| `hasDockerfile` | Root `Dockerfile` present |
| `moduleCount` | Number of build files found (> 1 = multi-module reactor) |

### 2b. Rules (8 checks)

```
blocker  ΓåÆ build-tool       no recognised build file at project root
blocker  ΓåÆ java-sources     zero .java files in archive
blocker  ΓåÆ zip-slip         unsafe entry path detected

warning  ΓåÆ existing-tests   no src/test directory
warning  ΓåÆ java-version     source level not declared in build file
warning  ΓåÆ dockerfile       no Dockerfile found
warning  ΓåÆ n-plus-one       FetchType.EAGER or bare @OneToMany in source
warning  ΓåÆ multi-module     more than one build file (multi-module reactor)

info     ΓåÆ docs             no docs/ folder (skip ΓÇö not a blocker)
```

### 2c. Score & tier

```
score = (passing non-skip checks) / (total non-skip checks) ├ù 100

tier:
  any blocker ΓåÆ 'unavailable'   review button stays disabled, pipeline stops
  ant build   ΓåÆ 'estimated'     static analysis only, no harness
  otherwise   ΓåÆ 'measured'      full harness eligible
```

The checklist renders live on **Page 2** (pass Γ£ô / warning ΓÜá / blocker Γ£ò /
skip ΓÇô). The **Review** button remains disabled until every blocker is resolved.

---

## 3. Static Analysis (always runs if no blockers)

Even without Docker, OptiScale derives *estimated* baseline metrics from the
source tree:

- LOC count and module topology from `ProjectFacts`
- N+1 risk from `FetchType.EAGER` / `@OneToMany` pattern scan
- Dependency lock file presence

These populate the perf table on **Page 3** with `source: "estimated"` badges
(amber outline). No number is fabricated ΓÇö missing data yields `0 / estimated`.

---

## 4. Harness Injection (`injectHarness`)

Runs only when `tier === 'measured'` **and** Docker is available on the host.

### Step-by-step

```
1. hashTree(projectDir)
   SHA-256 of every file under the project root (excluding .modernization/)
   Written to .modernization/.tree-sha256

2. copyTemplate(templates/modernization/ ΓåÆ <project>/.modernization/)
   Every @PLACEHOLDER@ token is substituted:
     @LEGACY_GROUP@    ΓåÆ  detected Maven groupId
     @LEGACY_ARTIFACT@ ΓåÆ  detected artifactId
     @LEGACY_VERSION@  ΓåÆ  1.0.0-legacy
     @MODERN_VERSION@  ΓåÆ  1.0.0-modern
     @LEGACY_JAVA@     ΓåÆ  detected source version (default 8)
     @MODERN_JAVA@     ΓåÆ  17
     @SPRING_BOOT_VERSION@ ΓåÆ detected or 3.2.0

3. patchAggregator(projectDir)
   Backs up pom.xml ΓåÆ pom.xml.optiscale.bak   (append-only, never regenerated)
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
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé  run-bench.sh   (BENCH_TIMEOUT default: 900s)   Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                Γöé
        ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
        Γöé  1. Maven build Γöé
        Γöé   -Plegacy      Γöé  ΓåÆ target/*-legacy.jar
        Γöé   -Pmodern      Γöé  ΓåÆ target/*-modern.jar
        ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                Γöé  exit 2 on failure ΓåÆ caller falls back to 'estimated'
        ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
        Γöé  2. Docker images     Γöé
        Γöé  Dockerfile.legacy    Γöé  eclipse-temurin:8-jre-alpine,  non-root
        Γöé  Dockerfile.modern    Γöé  eclipse-temurin:17-jre-alpine, non-root
        ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                Γöé
        ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
        Γöé  3. docker compose up                     Γöé
        Γöé  db (postgres:16-alpine, healthcheck)     Γöé
        Γöé  legacy  port 18080   modern  port 18081  Γöé
        Γöé  network: internal (no egress)            Γöé
        Γöé  read_only + tmpfs /tmp                   Γöé
        Γöé  cap_drop: ALL, no-new-privileges         Γöé
        Γöé  pids_limit: 256, CPU 2.0, RAM 1G         Γöé
        ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                Γöé
        ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
        Γöé  4. k6 load test (├ù2)         Γöé
        Γöé  grafana/k6  --network host   Γöé
        Γöé  ramping-vus: 1ΓåÆ10ΓåÆ50ΓåÆ0       Γöé
        Γöé  80s total per target         Γöé
        Γöé  ΓåÆ out/k6-legacy.json         Γöé
        Γöé  ΓåÆ out/k6-modern.json         Γöé
        ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                Γöé
        ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
        Γöé  5. ParityIT (Testcontainers / JUnit 5)   Γöé
        Γöé  Replays every fixture in src/test/       Γöé
        Γöé  resources/fixtures/ against both         Γöé
        Γöé  containers.                              Γöé
        Γöé  Normalizer strips volatile fields        Γöé
        Γöé  (timestamp, traceId, requestId,          Γöé
        Γöé   durationMs) and rounds floats to        Γöé
        Γöé  9 significant digits before compare.     Γöé
        Γöé  ΓåÆ target/parity-report.json             Γöé
        ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                Γöé
        ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
        Γöé  6. JMH microbenchmarks            Γöé
        Γöé  LatencyBenchmark (legacy+modern)  Γöé
        Γöé  5 warmup + 10 measurement iters   Γöé
        Γöé  2 forks, -Xms/-Xmx 512m          Γöé
        Γöé  ΓåÆ out/jmh.json                   Γöé
        ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                Γöé
        ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
        Γöé  7. merge-report.mjs              Γöé
        Γöé  reads k6-*.json, jmh.json,       Γöé
        Γöé  parity-report.json, sql/*.log    Γöé
        Γöé  ΓåÆ out/report.json               Γöé
        ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                Γöé
        ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
        Γöé  8. Image cleanup             Γöé
        Γöé  docker rmi legacy+modern     Γöé
        ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
```

p6spy intercepts every JDBC call during steps 3ΓÇô5 and writes
`out/sql/sql.log` ΓÇö the SQL statement count feeds `merge-report.mjs` as the
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
  1. mv pom.xml.optiscale.bak  ΓåÆ  pom.xml        (restores original aggregator)
  2. rm -rf .modernization/                       (removes all injected files)
  3. docker compose -p optiscale-bench down -v    (tears down containers)
  4. hashTree(projectDir)                         (recomputes SHA-256)
  5. assert actual === recorded                   (throws on mismatch)
```

Revert runs even on timeout or crash (bash `trap EXIT` in `run-bench.sh`,
`finally` block in the Node caller).

---

## 8. UI ΓÇö Page 3 Results

After the pipeline completes, **Page 3** shows:

- **RequirementsPanel** ΓÇö the same preflight checklist (score + tier pill +
  all check rows) so reviewers can see what gates were passed.
- **Performance table** ΓÇö one row per metric:

| Column | Content |
|---|---|
| metric | human name, e.g. "p95 latency (ms)" |
| tool | `k6` / `jmh` / `sql` / `static` |
| legacy | measured or estimated value |
| modern | measured or estimated value |
| delta | `+X%` / `-X%` coloured green (improvement) or red (regression) |
| source | `measured` (cyan filled) or `estimated` (amber outline ΓÇö never styled the same) |

The `estimated` badge is always visually distinct from `measured` ΓÇö this is a
non-negotiable design contract enforced in `src/styles.css`.

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
Each detector is a pure function `(src: string) => string | null` ΓÇö it returns
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
additional hit, capped at 2├ù:

```
projectedBoostMin = pattern.min ├ù (1 + (min(hitCount, 2) ΓêÆ 1) ├ù 0.2)
projectedBoostMax = pattern.max ├ù (1 + (min(hitCount, 2) ΓêÆ 1) ├ù 0.2)
```

The **composite** projected improvement sums all *performance-category*
patterns and caps the result at **80%** ΓÇö full additive compounding would be
unrealistic since patterns interact.

### 9d. Output shape (`SuggestionReport`)

```
{
  suggestions[]:           one entry per found pattern (sorted: critical ΓåÆ major ΓåÆ minor)
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

Every pattern ships an illustrative `beforeCode` and `afterCode` snippet ΓÇö
these are canonical examples of the transformation, **not** generated from the
actual uploaded file. They are shown verbatim in the UI using `escapeHtml()`
(assigned to `.innerHTML` via `<pre>` ΓÇö no syntax spans, no XSS risk).

---

## 10. Suggestions Panel (UI ΓÇö Page 3)

Rendered by `renderSuggestionsPanel()` in `src/main.ts` from
`sampleSuggestions` in `src/data.ts`.

### Layout of each suggestion card

```
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé  [critical] [performance]                Γåæ 20ΓÇô55% p95 latency  3 files Γöé
Γöé  N+1 query ΓÇö eager collection fetch                              Γöé
Γöé  FetchType.EAGER causes Hibernate to issue one SELECT perΓÇª       Γöé
Γöé  Γîé src/main/java/com/example/domain/Order.java                   Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ   Γöé
Γöé  Γöé before              Γöé after                              Γöé   Γöé
Γöé  Γöé @OneToMany(         Γöé @OneToMany(fetch = FetchType.LAZY) Γöé   Γöé
Γöé  Γöé   fetch=EAGER)      Γöé @Query("ΓÇªJOIN FETCHΓÇª")             Γöé   Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ   Γöé
Γöé  1. Change FetchType.EAGER ΓåÆ FetchType.LAZY on @OneToMany.       Γöé
Γöé  2. Add @Query with JOIN FETCH in the repository method.         Γöé
Γöé  3. Run ParityIT to verify response parity after the change.     Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
```

### Severity colour coding

| Badge | Colour | Meaning |
|---|---|---|
| `critical` | red | Must fix ΓÇö build blocker or major perf regression risk |
| `major` | amber | Should fix ΓÇö correctness or significant perf impact |
| `minor` | muted | Nice to fix ΓÇö small perf or code-quality improvement |

### Boost projection display

- Performance patterns ΓåÆ green `Γåæ MINΓÇôMAX% metric`
- Correctness / reliability patterns ΓåÆ cyan `reliability fix` (no % claim)
- Composite banner at the top: `projected composite improvement: 35ΓÇô75% p95 latency if all performance patterns are fixed`

The composite number is **never shown for correctness-only patterns** and is
always labelled as a projection, not a guarantee.
