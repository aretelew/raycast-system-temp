import { Cache, environment } from "@raycast/api";
import { execFile } from "node:child_process";
import path from "node:path";
import { parseTemperatureOutput, unavailableSnapshot } from "./normalize";
import { TemperatureSnapshot } from "./types";

const CACHE_KEY = "last-temperature-snapshot";
const cache = new Cache();

export async function readTemperatureSnapshot(options: { allowStale?: boolean } = {}): Promise<TemperatureSnapshot> {
  try {
    const output = await runHelper();
    const snapshot = parseTemperatureOutput(output);
    cache.set(CACHE_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cached = getCachedTemperatureSnapshot();

    if (options.allowStale && cached) {
      return {
        ...cached,
        error: `Showing last reading. ${message}`,
      };
    }

    return unavailableSnapshot(message);
  }
}

export function getCachedTemperatureSnapshot(): TemperatureSnapshot | undefined {
  const raw = cache.get(CACHE_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as TemperatureSnapshot;
  } catch {
    return undefined;
  }
}

function runHelper(): Promise<string> {
  const binaryPath = path.join(environment.assetsPath, "temperature-reader");

  return new Promise((resolve, reject) => {
    execFile(binaryPath, [], { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const stderrText = typeof stderr === "string" ? stderr.trim() : "";
        reject(new Error(stderrText ? `${error.message}: ${stderrText}` : error.message));
        return;
      }

      const output = String(stdout).trim();
      if (!output) {
        reject(new Error("Temperature helper returned no output"));
        return;
      }

      resolve(output);
    });
  });
}
