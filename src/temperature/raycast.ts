import { Color } from "@raycast/api";
import { TemperatureKind, TemperatureSeverity, ThermalState } from "./types";

export function severityColor(severity: TemperatureSeverity): Color {
  switch (severity) {
    case "normal":
      return Color.Green;
    case "warm":
      return Color.Yellow;
    case "hot":
      return Color.Orange;
    case "critical":
      return Color.Red;
    case "unavailable":
      return Color.SecondaryText;
  }
}

export function thermalStateColor(state: ThermalState): Color {
  switch (state) {
    case "nominal":
      return Color.Green;
    case "fair":
      return Color.Yellow;
    case "serious":
      return Color.Orange;
    case "critical":
      return Color.Red;
    case "unknown":
      return Color.SecondaryText;
  }
}

export function sensorKindColor(kind: TemperatureKind): Color {
  switch (kind) {
    case "cpu":
      return Color.Blue;
    case "gpu":
      return Color.Purple;
    case "battery":
      return Color.Green;
    case "storage":
      return Color.Magenta;
    case "other":
      return Color.SecondaryText;
  }
}
