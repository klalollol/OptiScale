package io.optiscale.bench;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.Closeable;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.Objects;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

/**
 * Loads serialised fixtures from the classpath and reflectively invokes the
 * legacy and modern entrypoint methods so that LatencyBenchmark can consume
 * results via a JMH Blackhole without ever receiving null.
 *
 * <p>The legacy and modern JARs are expected on the classpath as separate class
 * loaders (one per classifier).  The entrypoint class and method are resolved
 * once at construction time and cached for low per-call overhead.
 *
 * <p>Lifecycle: call {@link #load(String)} once per JMH trial, then call
 * {@link #close()} in the TearDown.  The class loaders are closed so the JVM
 * releases the JAR file handles.
 */
public final class FixtureReplay implements Closeable {

    // ── entrypoint coordinates (injected by the generator) ──────────────────
    private static final String LEGACY_CLASS  = "@LEGACY_ENTRYPOINT_CLASS@";
    private static final String LEGACY_METHOD = "@LEGACY_ENTRYPOINT_METHOD@";
    private static final String MODERN_CLASS  = "@MODERN_ENTRYPOINT_CLASS@";
    private static final String MODERN_METHOD = "@MODERN_ENTRYPOINT_METHOD@";

    // ── state ────────────────────────────────────────────────────────────────
    private final List<Object>    inputs;
    private final URLClassLoader  legacyLoader;
    private final URLClassLoader  modernLoader;
    private final Object          legacyInstance;
    private final Object          modernInstance;
    private final Method          legacyMethod;
    private final Method          modernMethod;

    // ── sentinel returned when a fixture produces a void result ─────────────
    private static final Object VOID_SENTINEL = new Object();

    private FixtureReplay(
            List<Object>   inputs,
            URLClassLoader legacyLoader,
            URLClassLoader modernLoader,
            Object         legacyInstance,
            Object         modernInstance,
            Method         legacyMethod,
            Method         modernMethod) {
        this.inputs         = inputs;
        this.legacyLoader   = legacyLoader;
        this.modernLoader   = modernLoader;
        this.legacyInstance = legacyInstance;
        this.modernInstance = modernInstance;
        this.legacyMethod   = legacyMethod;
        this.modernMethod   = modernMethod;
    }

    // ── factory ──────────────────────────────────────────────────────────────

    /**
     * Loads every {@code *.json} file under {@code fixturesBase} on the
     * classpath, then resolves the legacy and modern entrypoints.
     *
     * @param fixturesBase classpath-relative directory prefix, e.g. {@code "fixtures/"}
     */
    public static FixtureReplay load(String fixturesBase) {
        ObjectMapper mapper = new ObjectMapper();
        List<Object> inputs = new ArrayList<>();

        // Discover fixture JSONs from the classpath jar(s)
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        try {
            Enumeration<URL> roots = cl.getResources(fixturesBase);
            while (roots.hasMoreElements()) {
                URL rootUrl = roots.nextElement();
                String proto = rootUrl.getProtocol();
                if ("jar".equals(proto)) {
                    // e.g. jar:file:/path/to/bench.jar!/fixtures/
                    String jarPath = rootUrl.getPath();
                    int bang = jarPath.indexOf('!');
                    String jarFile = jarPath.substring("file:".length(), bang);
                    String prefix  = jarPath.substring(bang + 2); // strip !/
                    try (JarFile jar = new JarFile(jarFile)) {
                        Enumeration<JarEntry> entries = jar.entries();
                        while (entries.hasMoreElements()) {
                            JarEntry entry = entries.nextElement();
                            if (!entry.isDirectory()
                                    && entry.getName().startsWith(prefix)
                                    && entry.getName().endsWith(".json")) {
                                try (InputStream is = jar.getInputStream(entry)) {
                                    inputs.add(mapper.readValue(is, Object.class));
                                }
                            }
                        }
                    }
                } else if ("file".equals(proto)) {
                    Path dir = Paths.get(rootUrl.toURI());
                    if (Files.isDirectory(dir)) {
                        try (var stream = Files.walk(dir)) {
                            stream.filter(p -> p.toString().endsWith(".json"))
                                  .sorted()
                                  .forEach(p -> {
                                      try {
                                          inputs.add(mapper.readValue(p.toFile(), Object.class));
                                      } catch (Exception e) {
                                          throw new RuntimeException("Cannot parse fixture: " + p, e);
                                      }
                                  });
                        }
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to load fixtures from classpath:" + fixturesBase, e);
        }

        if (inputs.isEmpty()) {
            throw new IllegalStateException(
                "No fixture files found under classpath:" + fixturesBase +
                " — cannot run benchmark without inputs.");
        }

        // Resolve class loaders for legacy and modern JARs
        URLClassLoader legacyLoader = buildLoader("legacy", cl);
        URLClassLoader modernLoader = buildLoader("modern", cl);

        try {
            Class<?> legacyCls  = legacyLoader.loadClass(LEGACY_CLASS);
            Class<?> modernCls  = modernLoader.loadClass(MODERN_CLASS);
            Object   legacyInst = legacyCls.getDeclaredConstructor().newInstance();
            Object   modernInst = modernCls.getDeclaredConstructor().newInstance();

            // Resolve the first matching public method by name (parameter type
            // matching is intentionally loose — fixtures provide raw objects).
            Method legacyM = findMethod(legacyCls, LEGACY_METHOD);
            Method modernM = findMethod(modernCls, MODERN_METHOD);

            return new FixtureReplay(inputs, legacyLoader, modernLoader,
                                     legacyInst, modernInst, legacyM, modernM);
        } catch (Exception e) {
            closeQuietly(legacyLoader);
            closeQuietly(modernLoader);
            throw new RuntimeException("Failed to initialise FixtureReplay", e);
        }
    }

    // ── invocation ───────────────────────────────────────────────────────────

    /**
     * Invokes the legacy entrypoint with {@code input} and returns a non-null
     * result.  Void methods return {@link #VOID_SENTINEL} so Blackhole never
     * sees null.
     */
    public Object invokeLegacy(Object input) {
        return invoke(legacyMethod, legacyInstance, input);
    }

    /** Same contract as {@link #invokeLegacy(Object)} for the modern variant. */
    public Object invokeModern(Object input) {
        return invoke(modernMethod, modernInstance, input);
    }

    public List<Object> inputs() {
        return inputs;
    }

    // ── Closeable ────────────────────────────────────────────────────────────

    @Override
    public void close() {
        closeQuietly(legacyLoader);
        closeQuietly(modernLoader);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Object invoke(Method method, Object instance, Object input) {
        try {
            Object result = method.invoke(instance, input);
            // Void return — return sentinel so Blackhole always has a value
            return Objects.requireNonNullElse(result, VOID_SENTINEL);
        } catch (Exception e) {
            // Return sentinel on exception so the benchmark loop continues;
            // parity tests will surface the difference separately.
            return VOID_SENTINEL;
        }
    }

    private static Method findMethod(Class<?> cls, String name) {
        for (Method m : cls.getMethods()) {
            if (m.getName().equals(name) && m.getParameterCount() == 1) {
                return m;
            }
        }
        throw new IllegalArgumentException(
            "No single-arg public method '" + name + "' found on " + cls.getName());
    }

    /**
     * Builds a URLClassLoader that loads classes from the JAR on the
     * classpath that was built with the given classifier (legacy or modern).
     * Falls back to the context class loader if no separate JAR is found —
     * this allows the benchmark to run even during local development where
     * only one classpath is present.
     */
    private static URLClassLoader buildLoader(String classifier, ClassLoader parent) {
        try {
            Enumeration<URL> urls = parent.getResources("META-INF/MANIFEST.MF");
            List<URL> jars = new ArrayList<>();
            while (urls.hasMoreElements()) {
                URL u = urls.nextElement();
                String s = u.toString();
                if (s.contains(classifier)) {
                    // strip the jar:file: prefix and !/META-INF/MANIFEST.MF suffix
                    String jarUrl = s.substring(4, s.indexOf('!'));
                    jars.add(new URL(jarUrl));
                }
            }
            if (!jars.isEmpty()) {
                return new URLClassLoader(jars.toArray(new URL[0]), parent);
            }
        } catch (Exception ignored) {
            // fall through
        }
        // Fallback: isolated child loader pointing at whole classpath
        return new URLClassLoader(new URL[0], parent);
    }

    private static void closeQuietly(URLClassLoader cl) {
        try { cl.close(); } catch (Exception ignored) { /* best effort */ }
    }
}
