/**
 * Anti-pattern definitions and their source-scanning detectors.
 * Browser-safe — no Node APIs. Each detector receives the full text of a
 * single .java file and returns the matched snippet (or null).
 */

import type { AntiPattern } from './types';

// ─── Pattern definitions ──────────────────────────────────────────────────────

export const ANTI_PATTERNS: AntiPattern[] = [
  // ── 1. N+1 / Eager fetch ──────────────────────────────────────────────────
  {
    id: 'n-plus-one-eager',
    label: 'N+1 query — eager collection fetch',
    category: 'performance',
    severity: 'critical',
    description:
      'FetchType.EAGER on a collection causes Hibernate to issue one SELECT per ' +
      'parent row, exploding query counts under load. Switch to LAZY + JOIN FETCH ' +
      'in the specific query that needs the data.',
    estimatedImpact: { metric: 'p95 latency', min: 20, max: 55, unit: '%' },
    beforeCode:
      '@OneToMany(fetch = FetchType.EAGER)\nprivate List<OrderItem> items;',
    afterCode:
      '@OneToMany(fetch = FetchType.LAZY)\nprivate List<OrderItem> items;\n\n' +
      '// In repository:\n@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")\nOptional<Order> findWithItems(@Param("id") Long id);',
    fixSteps: [
      'Change FetchType.EAGER → FetchType.LAZY on the @OneToMany/@ManyToMany.',
      'Add a @Query with JOIN FETCH in the repository method that actually needs the collection.',
      'Run ParityIT to verify response parity after the change.',
    ],
  },

  // ── 2. Blocking HTTP call on request thread ───────────────────────────────
  {
    id: 'blocking-http',
    label: 'Blocking HTTP on request thread',
    category: 'performance',
    severity: 'critical',
    description:
      'RestTemplate.getForObject() / exchange() blocks the servlet thread while ' +
      'waiting for a remote call. Under concurrency this starves the thread pool. ' +
      'Replace with WebClient (reactive) or a virtual-thread-friendly HTTP client.',
    estimatedImpact: { metric: 'throughput', min: 30, max: 70, unit: '%' },
    beforeCode:
      'RestTemplate rest = new RestTemplate();\nString result = rest.getForObject(url, String.class);',
    afterCode:
      'WebClient client = WebClient.create();\nString result = client.get()\n  .uri(url)\n  .retrieve()\n  .bodyToMono(String.class)\n  .block(); // or chain reactively',
    fixSteps: [
      'Add spring-boot-starter-webflux to pom.xml.',
      'Replace RestTemplate bean with WebClient.Builder.',
      'Convert call sites to return Mono<T> or use .block() as a bridge.',
    ],
  },

  // ── 3. HttpSession for distributed state ─────────────────────────────────
  {
    id: 'http-session-state',
    label: 'HttpSession used for application state',
    category: 'modernization',
    severity: 'major',
    description:
      'Storing business state in HttpSession prevents horizontal scaling — ' +
      'sessions are node-local. Extract to Redis (Spring Session) or a stateless ' +
      'JWT token approach.',
    estimatedImpact: { metric: 'scalability', min: 40, max: 80, unit: '%' },
    beforeCode:
      'HttpSession session = request.getSession();\nsession.setAttribute("cart", cart);',
    afterCode:
      '// application.properties:\n// spring.session.store-type=redis\n\n// Code unchanged — Spring Session transparently backs HttpSession with Redis',
    fixSteps: [
      'Add spring-session-data-redis to pom.xml.',
      'Set spring.session.store-type=redis in application.properties.',
      'Ensure session objects implement Serializable.',
    ],
  },

  // ── 4. new Thread() instead of executor ──────────────────────────────────
  {
    id: 'raw-thread-creation',
    label: 'Raw Thread instantiation',
    category: 'performance',
    severity: 'major',
    description:
      'Creating threads with new Thread() bypasses any thread-pool management, ' +
      'risks unbounded resource consumption, and does not benefit from virtual ' +
      'threads in Java 21. Use @Async or an ExecutorService.',
    estimatedImpact: { metric: 'throughput', min: 10, max: 30, unit: '%' },
    beforeCode:
      'new Thread(() -> sendEmail(user)).start();',
    afterCode:
      '// Service method:\n@Async\npublic CompletableFuture<Void> sendEmail(User user) { ... }\n\n// Caller:\nemailService.sendEmail(user); // fire and forget',
    fixSteps: [
      'Add @EnableAsync to a @Configuration class.',
      'Annotate the async method with @Async.',
      'Return CompletableFuture<Void> so Spring can manage completion.',
    ],
  },

  // ── 5. String concatenation in loop ──────────────────────────────────────
  {
    id: 'string-concat-loop',
    label: 'String concatenation inside loop',
    category: 'performance',
    severity: 'minor',
    description:
      'Using += to build a String inside a loop creates a new String object on ' +
      'every iteration (O(n²) allocations). Use StringBuilder or String.join().',
    estimatedImpact: { metric: 'avg method time', min: 5, max: 25, unit: '%' },
    beforeCode:
      'String result = "";\nfor (String s : list) {\n  result += s + ", ";\n}',
    afterCode:
      'String result = String.join(", ", list);\n// or:\nStringBuilder sb = new StringBuilder();\nfor (String s : list) sb.append(s).append(", ");',
    fixSteps: [
      'Replace the accumulator variable with a StringBuilder.',
      'Use sb.toString() after the loop.',
      'For simple cases, prefer String.join() or streams with Collectors.joining().',
    ],
  },

  // ── 6. Catching raw Exception ─────────────────────────────────────────────
  {
    id: 'catch-raw-exception',
    label: 'catch (Exception e) swallowing errors',
    category: 'correctness',
    severity: 'major',
    description:
      'Catching the top-level Exception (or worse, Throwable) hides bugs, ' +
      'swallows InterruptedException, and makes root-cause analysis impossible. ' +
      'Catch the narrowest type possible and always re-interrupt on InterruptedException.',
    estimatedImpact: { metric: 'reliability', min: 0, max: 0, unit: '%' },
    beforeCode:
      'try {\n  riskyOp();\n} catch (Exception e) {\n  log.warn("failed", e);\n}',
    afterCode:
      'try {\n  riskyOp();\n} catch (SpecificException e) {\n  log.error("riskyOp failed: {}", e.getMessage(), e);\n  throw new ServiceException("riskyOp failed", e);\n}',
    fixSteps: [
      'Identify the specific checked exceptions thrown by the called method.',
      'Replace catch (Exception e) with catch (SpecificException e).',
      'If InterruptedException is possible, call Thread.currentThread().interrupt() before re-throwing.',
    ],
  },

  // ── 7. javax.* imports (Jakarta migration) ───────────────────────────────
  {
    id: 'javax-imports',
    label: 'javax.* imports (Spring Boot 2 → 3 blocker)',
    category: 'modernization',
    severity: 'critical',
    description:
      'Spring Boot 3 requires Jakarta EE 9+ which renamed all javax.* packages ' +
      'to jakarta.*. Any remaining javax.servlet, javax.persistence, or ' +
      'javax.validation import will fail to compile against Spring Boot 3.',
    estimatedImpact: { metric: 'build success', min: 100, max: 100, unit: '%' },
    beforeCode:
      'import javax.persistence.Entity;\nimport javax.servlet.http.HttpServletRequest;\nimport javax.validation.constraints.NotNull;',
    afterCode:
      'import jakarta.persistence.Entity;\nimport jakarta.servlet.http.HttpServletRequest;\nimport jakarta.validation.constraints.NotNull;',
    fixSteps: [
      'Run: find src -name "*.java" | xargs sed -i "s/javax\\.persistence/jakarta.persistence/g"',
      'Repeat for javax.servlet → jakarta.servlet and javax.validation → jakarta.validation.',
      'Update pom.xml to Spring Boot 3.x parent and Jakarta EE 10 BOM.',
    ],
  },

  // ── 8. Missing @Transactional on multi-step write ────────────────────────
  {
    id: 'missing-transactional',
    label: 'Multi-step DB write without @Transactional',
    category: 'correctness',
    severity: 'major',
    description:
      'Methods that call repository.save() multiple times without @Transactional ' +
      'leave the database in a partially updated state if an exception occurs ' +
      'mid-method. Each save() runs in its own auto-commit transaction.',
    estimatedImpact: { metric: 'reliability', min: 0, max: 0, unit: '%' },
    beforeCode:
      'public void placeOrder(Order order) {\n  orderRepo.save(order);          // auto-commits\n  inventoryRepo.deduct(order);   // auto-commits — orphaned if this throws\n}',
    afterCode:
      '@Transactional\npublic void placeOrder(Order order) {\n  orderRepo.save(order);\n  inventoryRepo.deduct(order);   // rolls back with order.save if this throws\n}',
    fixSteps: [
      'Add @Transactional to the service method that performs multiple writes.',
      'Ensure the method is called through the Spring proxy (not this.method() internally).',
      'Add @Transactional(readOnly = true) to read-only methods for performance.',
    ],
  },
];

// ─── Per-pattern regex detectors ─────────────────────────────────────────────

/** Returns the first matched snippet from `src`, or null. */
type Detector = (src: string) => string | null;

function firstMatch(src: string, re: RegExp): string | null {
  const m = src.match(re);
  return m ? m[0].trim().slice(0, 120) : null;
}

export const DETECTORS: Record<string, Detector> = {
  'n-plus-one-eager': (src) =>
    firstMatch(src, /FetchType\.EAGER|@OneToMany(?![\s\S]{0,80}fetch\s*=\s*FetchType\.LAZY)/),

  'blocking-http': (src) =>
    firstMatch(src, /new\s+RestTemplate\s*\(\)|restTemplate\.(getForObject|exchange|postForEntity)\s*\(/),

  'http-session-state': (src) =>
    firstMatch(src, /HttpSession\s+\w+\s*=|request\.getSession\s*\(\)\s*\.setAttribute/),

  'raw-thread-creation': (src) =>
    firstMatch(src, /new\s+Thread\s*\(/),

  'string-concat-loop': (src) =>
    firstMatch(src, /for\s*\([^)]+\)\s*\{[^}]*\+=\s*[^;]+;[^}]*\}/s),

  'catch-raw-exception': (src) =>
    firstMatch(src, /catch\s*\(\s*(Exception|Throwable)\s+\w+\s*\)/),

  'javax-imports': (src) =>
    firstMatch(src, /import\s+javax\.(persistence|servlet|validation)\./),

  'missing-transactional': (src) => {
    // Heuristic: method with 2+ repo.save() calls and no @Transactional above it
    if (!/\w+Repo(?:sitory)?\.\w*(save|persist|update)\s*\(/.test(src)) return null;
    const saves = (src.match(/\w+Repo(?:sitory)?\.\w*(save|persist|update)\s*\(/g) ?? []).length;
    if (saves < 2) return null;
    if (/@Transactional/.test(src)) return null;
    return `${saves} repository writes found without @Transactional`;
  },
};

/** Returns the 1-based line number of the first match of `re` in `src`. */
export function matchLine(src: string, re: RegExp): number | null {
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i + 1;
  }
  return null;
}

/** Line-locator regexes, keyed by pattern id. */
export const LINE_LOCATORS: Record<string, RegExp> = {
  'n-plus-one-eager':    /FetchType\.EAGER|@OneToMany/,
  'blocking-http':       /new\s+RestTemplate\s*\(|restTemplate\.\w+\s*\(/,
  'http-session-state':  /HttpSession|getSession\s*\(\)/,
  'raw-thread-creation': /new\s+Thread\s*\(/,
  'string-concat-loop':  /\+=\s*["'\w]/,
  'catch-raw-exception': /catch\s*\(\s*(Exception|Throwable)/,
  'javax-imports':       /import\s+javax\./,
  'missing-transactional': /\w+Repo(?:sitory)?\.\w*(save|persist|update)\s*\(/,
};
