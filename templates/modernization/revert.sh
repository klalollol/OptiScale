#!/usr/bin/env bash
# Restores the uploaded project to its pre-injection state.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for bak in "$ROOT"/pom.xml.optiscale.bak \
           "$ROOT"/settings.gradle.optiscale.bak \
           "$ROOT"/settings.gradle.kts.optiscale.bak; do
  [ -f "$bak" ] && mv -f "$bak" "${bak%.optiscale.bak}" && echo "restored ${bak%.optiscale.bak}"
done

rm -rf "$ROOT/.modernization"
docker compose -p optiscale-bench down -v --remove-orphans >/dev/null 2>&1 || true
echo "revert complete — project is byte-identical to upload"
