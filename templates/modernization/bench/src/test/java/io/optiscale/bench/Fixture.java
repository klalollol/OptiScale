package io.optiscale.bench;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Represents one recorded HTTP exchange used for parity and benchmark replay.
 *
 * <p>Fields:
 * <ul>
 *   <li>{@code id}     — unique name (typically the file stem)</li>
 *   <li>{@code path}   — HTTP path, e.g. {@code /api/orders/42}</li>
 *   <li>{@code method} — HTTP verb (GET, POST, …)</li>
 *   <li>{@code body}   — request body as a JSON string, or {@code null} for GET</li>
 * </ul>
 *
 * <p>The on-disk format is a single JSON object:
 * <pre>
 * {
 *   "id":     "order-42",
 *   "path":   "/api/orders/42",
 *   "method": "GET",
 *   "body":   null
 * }
 * </pre>
 */
public record Fixture(String id, String path, String method, String body) {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Reads a {@code Fixture} from a JSON file.  The file stem is used as
     * the {@code id} when the JSON object does not contain an {@code id} field.
     */
    public static Fixture from(Path file) {
        try {
            JsonNode node = MAPPER.readTree(Files.readString(file));
            String id     = node.has("id")
                                ? node.get("id").asText()
                                : stem(file);
            String path   = node.get("path").asText();
            String method = node.has("method") ? node.get("method").asText() : "GET";
            String body   = node.has("body") && !node.get("body").isNull()
                                ? node.get("body").toString()
                                : null;
            return new Fixture(id, path, method, body);
        } catch (Exception e) {
            throw new RuntimeException("Cannot parse fixture: " + file, e);
        }
    }

    private static String stem(Path file) {
        String name = file.getFileName().toString();
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }

    @Override
    public String toString() {
        return id;
    }
}
