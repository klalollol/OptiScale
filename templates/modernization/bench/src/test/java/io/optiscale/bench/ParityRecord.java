package io.optiscale.bench;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.List;

/**
 * Records one instance of behavioural drift between legacy and modern responses.
 *
 * <p>Fields:
 * <ul>
 *   <li>{@code id}             — fixture id that triggered the drift</li>
 *   <li>{@code legacyResponse} — normalised legacy response (JSON string)</li>
 *   <li>{@code modernResponse} — normalised modern response (JSON string)</li>
 * </ul>
 */
public record ParityRecord(String id, String legacyResponse, String modernResponse) {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Serialises a list of {@link ParityRecord} instances to a JSON array
     * suitable for writing to {@code target/parity-report.json}.
     *
     * <p>If the list is empty the returned JSON is still a valid array: {@code []}.
     */
    public static String toJson(List<ParityRecord> records) {
        try {
            ArrayNode arr = MAPPER.createArrayNode();
            for (ParityRecord rec : records) {
                ObjectNode obj = MAPPER.createObjectNode();
                obj.put("id",             rec.id());
                obj.put("legacyResponse", rec.legacyResponse());
                obj.put("modernResponse", rec.modernResponse());
                arr.add(obj);
            }
            return MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(arr);
        } catch (Exception e) {
            throw new RuntimeException("Cannot serialise parity records", e);
        }
    }
}
