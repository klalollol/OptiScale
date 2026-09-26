package io.optiscale.bench;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Black-box parity: replays every recorded fixture against the legacy and the
 * modernized container and asserts byte-equivalent responses.
 */
@Testcontainers
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ParityIT {

    private static final Network NET = Network.newNetwork();
    private static final Path FIXTURES = Path.of("src/test/resources/fixtures");
    private static final List<String> IGNORED_FIELDS =
            List.of("timestamp", "traceId", "requestId", "durationMs");

    @Container
    static PostgreSQLContainer<?> DB = new PostgreSQLContainer<>("postgres:16-alpine")
            .withNetwork(NET)
            .withNetworkAliases("db")
            .withInitScript("seed.sql");

    @Container
    static GenericContainer<?> LEGACY = new GenericContainer<>("optiscale/legacy:bench")
            .withNetwork(NET)
            .withExposedPorts(8080)
            .dependsOn(DB);

    @Container
    static GenericContainer<?> MODERN = new GenericContainer<>("optiscale/modern:bench")
            .withNetwork(NET)
            .withExposedPorts(8080)
            .dependsOn(DB);

    private final HttpClient http = HttpClient.newHttpClient();
    private final List<ParityRecord> drift = new ArrayList<>();

    static Stream<Fixture> fixtures() throws Exception {
        try (var paths = Files.list(FIXTURES)) {
            return paths.filter(p -> p.toString().endsWith(".json"))
                        .map(Fixture::from)
                        .toList()
                        .stream();
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("fixtures")
    void responsesAreIdentical(Fixture fx) throws Exception {
        JsonNode legacy = call(LEGACY, fx);
        JsonNode modern = call(MODERN, fx);

        JsonNode a = Normalizer.strip(legacy, IGNORED_FIELDS);
        JsonNode b = Normalizer.strip(modern, IGNORED_FIELDS);

        if (!a.equals(b)) {
            drift.add(new ParityRecord(fx.id(), a.toString(), b.toString()));
        }
        assertEquals(a, b, "Behavioural drift on " + fx.id());
    }

    @AfterAll
    void writeReport() throws Exception {
        Files.createDirectories(Path.of("target"));
        Files.writeString(
                Path.of("target/parity-report.json"),
                ParityRecord.toJson(drift));
    }

    private JsonNode call(GenericContainer<?> c, Fixture fx) throws Exception {
        String base = "http://" + c.getHost() + ":" + c.getMappedPort(8080);
        HttpRequest req = HttpRequest.newBuilder(URI.create(base + fx.path()))
                .method(fx.method(),
                        fx.body() == null
                                ? HttpRequest.BodyPublishers.noBody()
                                : HttpRequest.BodyPublishers.ofString(fx.body()))
                .header("Content-Type", "application/json")
                .build();
        return Normalizer.parse(
                http.send(req, HttpResponse.BodyHandlers.ofString()).body());
    }
}
