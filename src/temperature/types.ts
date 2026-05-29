export type TemperatureUnit = "celsius" | "fahrenheit";

export type MenuBarMetric = "cpuAverage" | "cpuMax" | "gpuAverage";

export type ThermalState = "nominal" | "fair" | "serious" | "critical" | "unknown";

export type TemperatureKind = "cpu" | "gpu" | "battery" | "storage" | "other";

export type TemperatureSeverity = "normal" | "warm" | "hot" | "critical" | "unavailable";

export type TemperatureSensor = {
  id: string;
  label: string;
  kind: TemperatureKind;
  temperatureC: number;
};

export type TemperatureSnapshot = {
  source: "embedded-helper";
  collectedAt: string;
  chipModel: string;
  machineModel: string;
  coreCount: number;
  thermalState: ThermalState;
  cpuAverageC: number | null;
  cpuMaxC: number | null;
  gpuAverageC: number | null;
  sensors: TemperatureSensor[];
  error?: string;
};

export type ExtensionPreferences = {
  temperatureUnit: TemperatureUnit;
  menuBarMetric: MenuBarMetric;
  showRawSensors: boolean;
};

export type HelperPayload = {
  source?: unknown;
  sensors?: unknown;
  cpuAverage?: unknown;
  cpuMax?: unknown;
  gpuAverage?: unknown;
  chipModel?: unknown;
  machineModel?: unknown;
  coreCount?: unknown;
  thermalState?: unknown;
};
