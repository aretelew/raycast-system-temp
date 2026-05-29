/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Temperature Unit - Unit used to display temperature values. */
  "temperatureUnit": "celsius" | "fahrenheit",
  /** Menu Bar Metric - Temperature value shown in the menu bar. */
  "menuBarMetric": "cpuAverage" | "cpuMax" | "gpuAverage",
  /** Show Raw Sensors - Show individual sensor readings when available. */
  "showRawSensors": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `show-temperature` command */
  export type ShowTemperature = ExtensionPreferences & {}
  /** Preferences accessible in the `menubar-temperature` command */
  export type MenubarTemperature = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `show-temperature` command */
  export type ShowTemperature = {}
  /** Arguments passed to the `menubar-temperature` command */
  export type MenubarTemperature = {}
}

