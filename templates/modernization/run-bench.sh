#!/usr/bin/env bash
# OptiScale benchmark orchestrator. Exits 0 with JSON on stdout, or 2 if the
# project could not be built (caller then falls back to tier="estimated").
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOD="$ROOT/.modernization"
OUT="$MOD/out"
TIMEOUT="${BENCH_TIMEOUT:-900}"

mkdir -p "$OUT/sql"

log()  { printf '\033[36m[bench]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[31m[bench] %s\033[0m\n' "$*" >&2; exit 2; }

trap 'docker compose -f "$MOD/perf/docker-compose.bench.yml" down -v --remove-orphans >/dev/null 2>&1 || true' EXIT

# ── 1. build both artifacts ─────────────────────────────────────────────────
log "building legacy artifact (Java @LEGACY_JAVA@ toolchain)"
(cd "$ROOT" && ./mvnw -q -Plegacy -DskipTests package) || fail "legacy build failed"

log "building modern artifact (Java @MODERN_JAVA@ toolchain)"
(cd "$ROOT" && ./mvnw -q -Pmodern -DskipTests package) || fail "modern build failed"

# ── 2. images ──────────────────────────────────────────────────────────────
log "building bench images"
docker build -q -f "$MOD/perf/Dockerfile.legacy" -t optiscale/legacy:bench  "$ROOT" >/dev/null
docker build -q -f "$MOD/perf/Dockerfile.modern" -t optiscale/modern:bench  "$ROOT" >/dev/null

# ── 3. stack up ────────────────────────────────────────────────────────────
log "starting bench stack"
docker compose -f "$MOD/perf/docker-compose.bench.yml" up -d --wait --wait-timeout 180

# ── 4. k6 against both ─────────────────────────────────────────────────────
for pair in "legacy:18080" "modern:18081"; do
  label="${pair%%:*}"; port="${pair##*:}"
  log "k6 → $label"
  timeout "$TIMEOUT" docker run --rm --network host \
    -v "$MOD/perf/k6:/scripts:ro" -v "$OUT:/out" \
    -e TARGET_URL="http://localhost:$port" -e TARGET_LABEL="$label" \
    grafana/k6:latest run /scripts/scenario.js || log "k6 $label finished with findings"
done

# ── 5. parity + JMH ────────────────────────────────────────────────────────
log "parity integration tests"
(cd "$MOD/bench" && ../../mvnw -q verify) || log "parity tests reported drift"
cp "$MOD/bench/target/parity-report.json" "$OUT/" 2>/dev/null || true

log "JMH micro-benchmarks"
java -jar "$MOD/bench/target/bench.jar" \
  -rf json -rff "$OUT/jmh.json" -foe false \
  || log "jmh completed with warnings"

# ── 6. merge ───────────────────────────────────────────────────────────────
log "merging report"
node "$MOD/tools/merge-report.mjs" --out "$OUT" > "$OUT/report.json"
cat "$OUT/report.json"

# ── 7. cleanup images ──────────────────────────────────────────────────────
log "removing bench images"
docker rmi optiscale/legacy:bench optiscale/modern:bench >/dev/null 2>&1 || true
