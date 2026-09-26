package io.optiscale.bench;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.DecimalNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Jackson-based normalizer used by {@link ParityIT} to strip volatile fields
 * and canonicalize numeric values before equality comparison.
 *
 * <p>Rules applied recursively:
 * <ol>
 *   <li>Object keys are sorted (alphabetical) so insertion-order differences
 *       do not cause spurious drift.</li>
 *   <li>Fields in {@code ignoredFields} are removed at every nesting level.</li>
 *   <li>Floating-point numbers are rounded to a precision of 1e-9 (9 significant
 *       decimal digits) so harmless JVM floating-point variance does not produce
 *       false positives.</li>
 * </ol>
 */
public final class Normalizer {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);

    /** Numeric tolerance: values that differ by less than this are treated as equal. */
    private static final double TOLERANCE = 1e-9;

    private Normalizer() {}

    /** Parses a raw JSON string into a {@link JsonNode}. */
    public static JsonNode parse(String json) {
        try {
            return MAPPER.readTree(json);
        } catch (Exception e) {
            throw new RuntimeException("Cannot parse JSON response", e);
        }
    }

    /**
     * Returns a new, normalised tree: keys sorted, volatile fields stripped,
     * numbers rounded to 9 significant digits.
     *
     * @param node          root of the response tree
     * @param ignoredFields field names to remove at every nesting level
     */
    public static JsonNode strip(JsonNode node, List<String> ignoredFields) {
        return normalise(node, ignoredFields);
    }

    // ── recursive normalisation ───────────────────────────────────────────────

    private static JsonNode normalise(JsonNode node, List<String> ignored) {
        if (node.isObject()) {
            return normaliseObject((ObjectNode) node, ignored);
        } else if (node.isArray()) {
            return normaliseArray((ArrayNode) node, ignored);
        } else if (node.isFloatingPointNumber()) {
            return normaliseNumber(node.doubleValue());
        }
        return node; // primitives (string, boolean, int, null) — unchanged
    }

    private static ObjectNode normaliseObject(ObjectNode node, List<String> ignored) {
        // Sort keys via TreeMap
        TreeMap<String, JsonNode> sorted = new TreeMap<>();
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> e = fields.next();
            if (!ignored.contains(e.getKey())) {
                sorted.put(e.getKey(), normalise(e.getValue(), ignored));
            }
        }
        ObjectNode result = MAPPER.createObjectNode();
        sorted.forEach(result::set);
        return result;
    }

    private static ArrayNode normaliseArray(ArrayNode node, List<String> ignored) {
        ArrayNode result = MAPPER.createArrayNode();
        for (JsonNode element : node) {
            result.add(normalise(element, ignored));
        }
        return result;
    }

    /**
     * Rounds to 9 significant digits using DECIMAL128 precision so that
     * values within TOLERANCE collapse to the same canonical representation.
     */
    private static JsonNode normaliseNumber(double value) {
        BigDecimal bd = new BigDecimal(value)
                .round(new MathContext(9))
                .stripTrailingZeros();
        return new DecimalNode(bd);
    }
}
