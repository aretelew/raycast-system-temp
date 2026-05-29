import { MenuBarMetric, TemperatureSeverity, TemperatureSnapshot, TemperatureUnit, ThermalState } from "./types";

export function formatTemperature(temperatureC: number | null | undefined, unit: TemperatureUnit): string {
  if (temperatureC === null || temperatureC === undefined || !Number.isFinite(temperatureC)) {
    return "N/A";
  }

  if (unit === "fahrenheit") {
    return `${Math.round((temperatureC * 9) / 5 + 32)} \u00b0F`;
  }

  return `${Math.round(temperatureC)} \u00b0C`;
}

export function getSeverity(temperatureC: number | null | undefined): TemperatureSeverity {
  if (temperatureC === null || temperatureC === undefined || !Number.isFinite(temperatureC)) {
    return "unavailable";
  }
  if (temperatureC >= 95) {
    return "critical";
  }
  if (temperatureC >= 80) {
    return "hot";
  }
  if (temperatureC >= 65) {
    return "warm";
  }
  return "normal";
}

export function severityLabel(severity: TemperatureSeverity): string {
  switch (severity) {
    case "normal":
      return "Normal";
    case "warm":
      return "Warm";
    case "hot":
      return "Hot";
    case "critical":
      return "Critical";
    case "unavailable":
      return "Unavailable";
  }
}

export function thermalStateLabel(state: ThermalState): string {
  switch (state) {
    case "nominal":
      return "Nominal";
    case "fair":
      return "Fair";
    case "serious":
      return "Serious";
    case "critical":
      return "Critical";
    case "unknown":
      return "Unknown";
  }
}

export function metricLabel(metric: MenuBarMetric): string {
  switch (metric) {
    case "cpuAverage":
      return "CPU Average";
    case "cpuMax":
      return "CPU Maximum";
    case "gpuAverage":
      return "GPU Average";
  }
}

export function metricTemperature(snapshot: TemperatureSnapshot, metric: MenuBarMetric): number | null {
  switch (metric) {
    case "cpuAverage":
      return snapshot.cpuAverageC;
    case "cpuMax":
      return snapshot.cpuMaxC;
    case "gpuAverage":
      return snapshot.gpuAverageC;
  }
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });
}
