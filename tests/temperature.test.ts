import { describe, expect, it } from "vitest";
import { formatTemperature, getSeverity } from "../src/temperature/format";
import { normalizeHelperPayload, parseTemperatureOutput } from "../src/temperature/normalize";

const now = new Date("2026-05-29T12:00:00.000Z");

describe("temperature normalization", () => {
  it("normalizes helper payloads and classifies sensors", () => {
    const snapshot = normalizeHelperPayload(
      {
        chipModel: "Apple M5 Pro",
        machineModel: "Mac17,9",
        coreCount: 15,
        thermalState: "nominal",
        cpuAverage: 57.22,
        cpuMax: 62.84,
        gpuAverage: 51.1,
        sensors: [
          { name: "PMU tdie1", temperature: 56.4 },
          { name: "PMU tdie2", temperature: 58 },
          { name: "GPU tdev1", temperature: 51.1 },
          { name: "gas gauge", temperature: 31.6 },
        ],
      },
      now,
    );

    expect(snapshot).toMatchObject({
      source: "embedded-helper",
      collectedAt: "2026-05-29T12:00:00.000Z",
      chipModel: "Apple M5 Pro",
      machineModel: "Mac17,9",
      coreCount: 15,
      thermalState: "nominal",
      cpuAverageC: 57.2,
      cpuMaxC: 62.8,
      gpuAverageC: 51.1,
    });
    expect(snapshot.sensors.map((sensor) => sensor.kind)).toEqual(["cpu", "cpu", "gpu", "battery"]);
  });

  it("falls back to sensor-derived CPU and GPU metrics when summary values are missing", () => {
    const snapshot = normalizeHelperPayload(
      {
        cpuAverage: -1,
        cpuMax: -1,
        gpuAverage: -1,
        sensors: [
          { name: "PMU tdie1", temperature: 50 },
          { name: "PMU tdie2", temperature: 60 },
          { name: "GPU 1", temperature: 45 },
        ],
      },
      now,
    );

    expect(snapshot.cpuAverageC).toBe(55);
    expect(snapshot.cpuMaxC).toBe(60);
    expect(snapshot.gpuAverageC).toBe(45);
  });

  it("filters invalid temperatures and handles missing sensors", () => {
    const snapshot = normalizeHelperPayload(
      {
        sensors: [
          { name: "PMU tdie1", temperature: -5 },
          { name: "PMU tdie2", temperature: 200 },
          { name: "PMU tdie3", temperature: 0 },
        ],
      },
      now,
    );

    expect(snapshot.cpuAverageC).toBeNull();
    expect(snapshot.cpuMaxC).toBeNull();
    expect(snapshot.gpuAverageC).toBeNull();
    expect(snapshot.sensors).toEqual([]);
  });

  it("parses helper JSON output", () => {
    const snapshot = parseTemperatureOutput(
      JSON.stringify({
        chipModel: "Apple M5 Pro",
        thermalState: "fair",
        sensors: [{ name: "PMU tdie1", temperature: 70.1 }],
      }),
      now,
    );

    expect(snapshot.chipModel).toBe("Apple M5 Pro");
    expect(snapshot.thermalState).toBe("fair");
    expect(snapshot.cpuAverageC).toBe(70.1);
  });

  it("throws on invalid helper JSON", () => {
    expect(() => parseTemperatureOutput("not json", now)).toThrow();
  });
});

describe("temperature formatting", () => {
  it("formats celsius and fahrenheit values", () => {
    expect(formatTemperature(37.4, "celsius")).toBe("37 \u00b0C");
    expect(formatTemperature(37.4, "fahrenheit")).toBe("99 \u00b0F");
    expect(formatTemperature(null, "celsius")).toBe("N/A");
  });

  it("classifies severity thresholds", () => {
    expect(getSeverity(null)).toBe("unavailable");
    expect(getSeverity(64.9)).toBe("normal");
    expect(getSeverity(65)).toBe("warm");
    expect(getSeverity(80)).toBe("hot");
    expect(getSeverity(95)).toBe("critical");
  });
});
