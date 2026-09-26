package io.optiscale.bench;

import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;

import java.util.concurrent.TimeUnit;

/**
 * Method-level A/B benchmark. The generator replaces @TARGET_* placeholders
 * with the hot methods identified by Subagent 1.
 *
 * Results are ALWAYS consumed via Blackhole so the JIT cannot delete the work.
 */
@BenchmarkMode({Mode.AverageTime, Mode.Throughput})
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Benchmark)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
@Fork(value = 2, jvmArgsAppend = {"-Xms512m", "-Xmx512m"})
public class LatencyBenchmark {

    private FixtureReplay fixtures;

    @Setup(Level.Trial)
    public void setUp() {
        fixtures = FixtureReplay.load("fixtures/");
    }

    @Benchmark
    public void legacy(Blackhole bh) {
        for (Object input : fixtures.inputs()) {
            bh.consume(fixtures.invokeLegacy(input));
        }
    }

    @Benchmark
    public void modern(Blackhole bh) {
        for (Object input : fixtures.inputs()) {
            bh.consume(fixtures.invokeModern(input));
        }
    }

    @TearDown(Level.Trial)
    public void tearDown() {
        fixtures.close();
    }
}
