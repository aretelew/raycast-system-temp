import { Icon, MenuBarExtra, getPreferenceValues, launchCommand, LaunchType } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import {
  formatTemperature,
  formatTimestamp,
  getSeverity,
  metricLabel,
  metricTemperature,
  severityLabel,
  thermalStateLabel,
} from "./temperature/format";
import { getCachedTemperatureSnapshot, readTemperatureSnapshot } from "./temperature/reader";
import { sensorKindColor, severityColor, thermalStateColor } from "./temperature/raycast";
import { ExtensionPreferences } from "./temperature/types";

export default function Command() {
  const preferences = getPreferenceValues<ExtensionPreferences>();
  const cached = getCachedTemperatureSnapshot();
  const {
    data: freshData,
    isLoading,
    revalidate,
  } = usePromise(() => readTemperatureSnapshot({ allowStale: true }), []);
  const snapshot = freshData ?? cached;
  const metricValue = snapshot ? metricTemperature(snapshot, preferences.menuBarMetric) : null;

  return (
    <MenuBarExtra
      icon={{ source: Icon.Temperature, tintColor: severityColor(getSeverity(metricValue)) }}
      title={snapshot ? formatTemperature(metricValue, preferences.temperatureUnit) : undefined}
      tooltip={
        snapshot
          ? `${metricLabel(preferences.menuBarMetric)}: ${formatTemperature(metricValue, preferences.temperatureUnit)}`
          : "Mac Temperature"
      }
      isLoading={isLoading && !snapshot}
    >
      {snapshot ? (
        <>
          <MenuBarExtra.Section title="Temperature">
            <MenuBarExtra.Item
              title="CPU Average"
              subtitle={formatTemperature(snapshot.cpuAverageC, preferences.temperatureUnit)}
              icon={{ source: Icon.Dot, tintColor: severityColor(getSeverity(snapshot.cpuAverageC)) }}
            />
            <MenuBarExtra.Item
              title="CPU Maximum"
              subtitle={formatTemperature(snapshot.cpuMaxC, preferences.temperatureUnit)}
              icon={{ source: Icon.Dot, tintColor: severityColor(getSeverity(snapshot.cpuMaxC)) }}
            />
            <MenuBarExtra.Item
              title="GPU Average"
              subtitle={formatTemperature(snapshot.gpuAverageC, preferences.temperatureUnit)}
              icon={{ source: Icon.Dot, tintColor: severityColor(getSeverity(snapshot.gpuAverageC)) }}
            />
            <MenuBarExtra.Item title="Severity" subtitle={severityLabel(getSeverity(metricValue))} />
          </MenuBarExtra.Section>

          <MenuBarExtra.Section title="System">
            <MenuBarExtra.Item
              title="Thermal State"
              subtitle={thermalStateLabel(snapshot.thermalState)}
              icon={{ source: Icon.Dot, tintColor: thermalStateColor(snapshot.thermalState) }}
            />
            <MenuBarExtra.Item title="Chip" subtitle={snapshot.chipModel} />
            <MenuBarExtra.Item title="Machine" subtitle={snapshot.machineModel} />
            <MenuBarExtra.Item title="Collected" subtitle={formatTimestamp(snapshot.collectedAt)} />
          </MenuBarExtra.Section>

          {preferences.showRawSensors && snapshot.sensors.length > 0 ? (
            <MenuBarExtra.Section title="Raw Sensors">
              {snapshot.sensors.map((sensor) => (
                <MenuBarExtra.Item
                  key={sensor.id}
                  title={sensor.label}
                  subtitle={formatTemperature(sensor.temperatureC, preferences.temperatureUnit)}
                  icon={{ source: Icon.Dot, tintColor: sensorKindColor(sensor.kind) }}
                />
              ))}
            </MenuBarExtra.Section>
          ) : null}

          {snapshot.error ? (
            <MenuBarExtra.Section title="Reader Status">
              <MenuBarExtra.Item title="Using Cached Reading" subtitle={snapshot.error} />
            </MenuBarExtra.Section>
          ) : null}
        </>
      ) : (
        <MenuBarExtra.Section>
          <MenuBarExtra.Item title="No temperature data" subtitle="Run the helper build first" />
        </MenuBarExtra.Section>
      )}

      <MenuBarExtra.Section>
        <MenuBarExtra.Item title="Refresh" icon={Icon.ArrowClockwise} onAction={revalidate} />
        <MenuBarExtra.Item
          title="Open Temperature"
          icon={Icon.Window}
          onAction={() => launchCommand({ name: "show-temperature", type: LaunchType.UserInitiated })}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
