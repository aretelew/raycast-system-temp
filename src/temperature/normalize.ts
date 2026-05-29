import { HelperPayload, TemperatureKind, TemperatureSensor, TemperatureSnapshot, ThermalState } from "./types";

type RawSensor = {
  name?: unknown;
  temperature?: unknown;
};

const VALID_THERMAL_STATES = new Set<ThermalState>(["nominal", "fair", "serious", "critical", "unknown"]);

export function parseTemperatureOutput(output: string, now = new Date()): TemperatureSnapshot {
  const payload = JSON.parse(output.trim()) as HelperPayload;
  return normalizeHelperPayload(payload, now);
}

export function normalizeHelperPayload(payload: HelperPayload, now = new Date()): TemperatureSnapshot {
  const sensors = normalizeSensors(payload.sensors);
  const cpuSensors = sensors.filter((sensor) => sensor.kind === "cpu").map((sensor) => sensor.temperatureC);
  const gpuSensors = sensors.filter((sensor) => sensor.kind === "gpu").map((sensor) => sensor.temperatureC);

  const cpuAverageC = toTemperature(payload.cpuAverage) ?? average(cpuSensors);
  const cpuMaxC = toTemperature(payload.cpuMax) ?? max(cpuSensors);
  const gpuAverageC = toTemperature(payload.gpuAverage) ?? average(gpuSensors);

  return {
    source: "embedded-helper",
    collectedAt: now.toISOString(),
    chipModel: stringValue(payload.chipModel, "Unknown"),
    machineModel: stringValue(payload.machineModel, "Unknown"),
    coreCount: integerValue(payload.coreCount),
    thermalState: thermalStateValue(payload.thermalState),
    cpuAverageC,
    cpuMaxC,
    gpuAverageC,
    sensors,
  };
}

export function unavailableSnapshot(error: string, now = new Date()): TemperatureSnapshot {
  return {
    source: "embedded-helper",
    collectedAt: now.toISOString(),
    chipModel: "Unknown",
    machineModel: "Unknown",
    coreCount: 0,
    thermalState: "unknown",
    cpuAverageC: null,
    cpuMaxC: null,
    gpuAverageC: null,
    sensors: [],
    error,
  };
}

function normalizeSensors(value: unknown): TemperatureSensor[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((sensor, index) => {
    if (!sensor || typeof sensor !== "object") {
      return [];
    }

    const rawSensor = sensor as RawSensor;
    const name = stringValue(rawSensor.name, `Sensor ${index + 1}`);
    const temperatureC = toTemperature(rawSensor.temperature);
    if (temperatureC === null) {
      return [];
    }

    const kind = sensorKind(name);
    return [
      {
        id: sensorId(name, index),
        label: sensorLabel(name),
        kind,
        temperatureC,
      },
    ];
  });
}

function toTemperature(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value >= 130) {
    return null;
  }
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function max(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round(Math.max(...values) * 10) / 10;
}

function sensorKind(name: string): TemperatureKind {
  const lower = name.toLowerCase();
  if (lower.includes("gpu")) {
    return "gpu";
  }
  if (lower.includes("battery") || lower.includes("gas gauge")) {
    return "battery";
  }
  if (lower.includes("nand") || lower.includes("ssd") || lower.includes("storage")) {
    return "storage";
  }
  if (lower.includes("die") || lower.includes("cpu")) {
    return "cpu";
  }
  return "other";
}

function sensorLabel(name: string): string {
  const lower = name.toLowerCase();
  const dieMatch = lower.match(/tdie(\d+)/);
  if (dieMatch) {
    return `Die Sensor ${Number.parseInt(dieMatch[1], 10)}`;
  }

  const devMatch = lower.match(/tdev(\d+)/);
  if (devMatch) {
    return `Device Sensor ${Number.parseInt(devMatch[1], 10)}`;
  }

  if (lower.includes("gpu")) {
    return "GPU";
  }
  if (lower.includes("battery") || lower.includes("gas gauge")) {
    return "Battery";
  }
  if (lower.includes("nand")) {
    return "NAND Storage";
  }

  return name;
}

function sensorId(name: string, index: number): string {
  return `${index}-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function stringValue(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value;
}

function integerValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

function thermalStateValue(value: unknown): ThermalState {
  if (typeof value === "string" && VALID_THERMAL_STATES.has(value as ThermalState)) {
    return value as ThermalState;
  }
  return "unknown";
}
