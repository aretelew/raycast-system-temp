# System Temperature

A focused Raycast extension for viewing Apple Silicon temperature readings from an embedded local helper.

## Commands

- **Show Temperature**: searchable Raycast view for CPU average, CPU maximum, GPU average, thermal state, and raw sensors.
- **Menu Bar Temperature**: menu bar extra refreshed by Raycast every 30 seconds.

## Development

```bash
npm install
npm run build:helper
npm test
npm run lint
npm run build
npm run dev
```

The helper reads local IOKit/HID temperature sensors and outputs JSON only. It does not require `sudo`, does not control fans, and does not promise per-core temperatures on Apple Silicon.

Before publishing to the Raycast Store, replace the `author` field in `package.json` with your own Raycast username.
