import { Action, ActionPanel, Icon, List, Toast, getPreferenceValues, showToast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useEffect } from "react";
import {
  formatTemperature,
  formatTimestamp,
  getSeverity,
  metricLabel,
  severityLabel,
  thermalStateLabel,
} from "./temperature/format";
import { readTemperatureSnapshot } from "./temperature/reader";
import { sensorKindColor, severityColor, thermalStateColor } from "./temperature/raycast";
import { ExtensionPreferences, TemperatureSnapshot } from "./temperature/types";

export default function Command() {
  const preferences = getPreferenceValues<ExtensionPreferences>();
  const { data, isLoading, revalidate } = usePromise(() => readTemperatureSnapshot({ allowStale: true }), []);

  useEffect(() => {
    const interval = setInterval(revalidate, 3000);
    return () => clearInterval(interval);
  }, [revalidate]);

  const snapshot = data;

  return (
    <List isLoading={isLoading && !snapshot} isShowingDetail searchBarPlaceholder="Search temperature sensors">
      {snapshot ? (
        <>
          <List.Item
            id="summary"
            title="Temperature"
            icon={{ source: Icon.Temperature, tintColor: severityColor(getSeverity(snapshot.cpuAverageC)) }}
            accessories={[
              {
                text: {
                  value: formatTemperature(snapshot.cpuAverageC, preferences.temperatureUnit),
                  color: severityColor(getSeverity(snapshot.cpuAverageC)),
                },
                tooltip: "CPU average",
              },
              {
                text: {
                  value: severityLabel(getSeverity(snapshot.cpuAverageC)),
                  color: severityColor(getSeverity(snapshot.cpuAverageC)),
                },
              },
            ]}
            detail={<TemperatureDetail snapshot={snapshot} preferences={preferences} />}
            actions={<TemperatureActions snapshot={snapshot} revalidate={revalidate} />}
          />

          {preferences.showRawSensors && snapshot.sensors.length > 0 ? (
            <List.Section title="Raw Sensors">
              {snapshot.sensors.map((sensor) => (
                <List.Item
                  key={sensor.id}
                  title={sensor.label}
                  subtitle={sensor.kind}
                  icon={{ source: Icon.Dot, tintColor: sensorKindColor(sensor.kind) }}
                  accessories={[
                    {
                      text: {
                        value: formatTemperature(sensor.temperatureC, preferences.temperatureUnit),
                        color: severityColor(getSeverity(sensor.temperatureC)),
                      },
                    },
                  ]}
                  detail={
                    <List.Item.Detail
                      metadata={
                        <List.Item.Detail.Metadata>
                          <List.Item.Detail.Metadata.Label title="Sensor ID" text={sensor.id} />
                          <List.Item.Detail.Metadata.Label title="Kind" text={sensor.kind} />
                          <List.Item.Detail.Metadata.Label
                            title="Temperature"
                            text={{
                              value: formatTemperature(sensor.temperatureC, preferences.temperatureUnit),
                              color: severityColor(getSeverity(sensor.temperatureC)),
                            }}
                          />
                          <List.Item.Detail.Metadata.Label
                            title="Severity"
                            text={{
                              value: severityLabel(getSeverity(sensor.temperatureC)),
                              color: severityColor(getSeverity(sensor.temperatureC)),
                            }}
                          />
                        </List.Item.Detail.Metadata>
                      }
                    />
                  }
                  actions={<TemperatureActions snapshot={snapshot} revalidate={revalidate} />}
                />
              ))}
            </List.Section>
          ) : null}
        </>
      ) : (
        <List.EmptyView icon={Icon.Temperature} title="No temperature data" description="Run the helper build first." />
      )}
    </List>
  );
}

function TemperatureDetail({
  snapshot,
  preferences,
}: {
  snapshot: TemperatureSnapshot;
  preferences: ExtensionPreferences;
}) {
  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label
            title="CPU Average"
            text={{
              value: formatTemperature(snapshot.cpuAverageC, preferences.temperatureUnit),
              color: severityColor(getSeverity(snapshot.cpuAverageC)),
            }}
          />
          <List.Item.Detail.Metadata.Label
            title="CPU Maximum"
            text={{
              value: formatTemperature(snapshot.cpuMaxC, preferences.temperatureUnit),
              color: severityColor(getSeverity(snapshot.cpuMaxC)),
            }}
          />
          <List.Item.Detail.Metadata.Label
            title="GPU Average"
            text={{
              value: formatTemperature(snapshot.gpuAverageC, preferences.temperatureUnit),
              color: severityColor(getSeverity(snapshot.gpuAverageC)),
            }}
          />
          <List.Item.Detail.Metadata.Label
            title="Severity"
            text={{
              value: severityLabel(getSeverity(snapshot.cpuAverageC)),
              color: severityColor(getSeverity(snapshot.cpuAverageC)),
            }}
          />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label
            title="Thermal State"
            text={{
              value: thermalStateLabel(snapshot.thermalState),
              color: thermalStateColor(snapshot.thermalState),
            }}
          />
          <List.Item.Detail.Metadata.Label title="Chip" text={snapshot.chipModel} />
          <List.Item.Detail.Metadata.Label title="Machine" text={snapshot.machineModel} />
          <List.Item.Detail.Metadata.Label title="Logical CPUs" text={snapshot.coreCount.toString()} />
          <List.Item.Detail.Metadata.Label title="Collected" text={formatTimestamp(snapshot.collectedAt)} />
          <List.Item.Detail.Metadata.Label title="Menu Bar Metric" text={metricLabel(preferences.menuBarMetric)} />
          {snapshot.error ? (
            <>
              <List.Item.Detail.Metadata.Separator />
              <List.Item.Detail.Metadata.Label title="Reader Status" text={snapshot.error} />
            </>
          ) : null}
        </List.Item.Detail.Metadata>
      }
    />
  );
}

function TemperatureActions({ snapshot, revalidate }: { snapshot: TemperatureSnapshot; revalidate: () => void }) {
  return (
    <ActionPanel>
      <Action
        title="Refresh"
        icon={Icon.ArrowClockwise}
        onAction={() => {
          revalidate();
          showToast({ style: Toast.Style.Animated, title: "Refreshing temperature" });
        }}
      />
      <Action.CopyToClipboard title="Copy CPU Average" content={formatTemperature(snapshot.cpuAverageC, "celsius")} />
      <Action.CopyToClipboard title="Copy JSON" content={JSON.stringify(snapshot, null, 2)} />
    </ActionPanel>
  );
}
