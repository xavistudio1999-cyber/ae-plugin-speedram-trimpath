# MotionFlow Toolkit for After Effects

A practical starter plugin for Adobe After Effects built as a CEP panel + ExtendScript toolkit for common motion design operations:

- Speed Ramp (speedram)
- Trim Paths
- Smooth keyframes like a motion-flow easing workflow
- Stroke + Fill controls
- Text animation helpers

This project is designed as a prototype/starting point for a real After Effects extension. It is not a native C++ plugin, but it is a valid Adobe CEP panel workflow that runs inside After Effects through ExtendScript.

## Features

### 1. SpeedRam
Applies a quick speed ramp to the selected layer by enabling Time Remapping and keyframing the remap value to create slow/fast motion.

### 2. Trim Path
Adds a Trim Paths effect to the selected layer so you can animate the start/end of a path.

### 3. Motion Flow / smoother keyframes
Adds easing to existing keyframes for a smoother motion feel.

### 4. Stroke + Fill
Adds Fill and Stroke effects to selected layers for stylized path graphics.

### 5. Text animation
Adds a simple text animation with source-text and opacity keyframing for a quick kinetic intro.

## Project structure

- `CSXS/manifest.xml` – CEP extension manifest
- `extension/index.html` – plugin panel UI
- `extension/css/styles.css` – panel styling
- `extension/js/main.js` – UI logic and AE bridge
- `scripts/AfterEffectsMotionFlow.jsx` – ExtendScript functions that run inside After Effects

## Install

1. Copy the `extension/` folder into your After Effects CEP extension folder.
2. Put the `scripts/AfterEffectsMotionFlow.jsx` file in a folder you can load from ExtendScript Toolkit.
3. In After Effects, load the custom panel or run the JSX script manually.

Typical CEP extension folder on Windows:

`C:\Program Files\Common Files\Adobe\CEP\extensions\`

Typical CEP extension folder on macOS:

`/Library/Application Support/Adobe/CEP/extensions/`

## Usage

- Open the plugin panel inside After Effects.
- Select the target layer(s), then click the desired button.
- If you prefer a raw script workflow, run the JSX file from the ExtendScript Toolkit.

## Notes

This is intentionally a starter template. For production use, you can:

- package and sign the CEP extension
- add a more advanced UI
- adapt the motion logic to your animation style
- build additional presets for a full VFX toolkit

## License

MIT
