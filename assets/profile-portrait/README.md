# Interactive caricature / Rive

The approved design is `concepts/caricature-monochrome-v1.png`, based on the user's supplied profile. `actions/color/front.png` removes the background; `actions/color/turnaround.png` has eight drawn directions; `actions/color/laptop.png` has six pocket/extraction/opening/typing poses. These transparent ImageGen assets preserve the approved character design. The image bytes are unmodified; the generator crops and aligns them through Rive mesh UVs.

## Interaction

Idle eyes follow the pointer and blink naturally. Click, tap, Enter or Space starts one 4.8-second performance: anticipate → jump → three upright turns → land → reach into trouser pocket → pull out laptop → open/type → close/return it → idle. Repeated activation is disabled during the performance. Hidden/offscreen/reduced-motion changes cancel playback and timers. Reduced motion and loading/error states display the transparent static fallback. Arms and laptop actions are drawn pose frames, not a skeletal limb rig or a real 3D model.

## Rebuild (Rive CLI 1.1.1)

```sh
uv run --with pillow python scripts/inspectProfileActions.py
python3 scripts/buildProfilePortrait.py
rive assets/profile-portrait --verify
rive inspect assets/profile-portrait --summary
rive assets/profile-portrait --once
cp assets/profile-portrait/build/profile.riv public/profile-portrait/caricature-idle-v4.riv
cp assets/profile-portrait/actions/color/front.png public/profile-portrait/front-color-v3.png
cp node_modules/@rive-app/canvas/rive.wasm public/profile-portrait/rive-2.42.2.wasm
```

The inspector reads alpha to find silhouette bounds and head/foot anchors, and writes `actions/color/frames.json`; it does not alter pixels. The generator writes the editable `scene.rml` and the React fallback's `portrait-frame.json`. The fallback is inline SVG with an external transparent PNG, so it works before WASM loads and without a canvas.

Artboard: `Portrait` (1024×1024), state machine: `Gaze`, view model: `PortraitState`.

| Number | Range | Purpose |
| --- | --- | --- |
| `lookX` | −12…12 | Shared pupil X offset |
| `lookY` | −5…5 | Shared pupil Y offset |
| `eyeOpen` | 0.001…1 | Eye opening height |
| `eyeClosed` | 0…1 | Closed eyelid visibility |
| `action` | 0, 1, 2 | Idle, click performance (280 frames), or head scratch (126 frames); 60 fps |

The About page lazy-loads the Rive runtime and serves WASM locally. Rendering pauses between movements/blinks; event listeners, frames and timers are cleaned up on unmount. Original `public/profile.jpeg` remains unchanged. No deployment or external hosting is required for these assets.

## Color and effects

The approved monochrome concept is retained as reference. Current sprites use warm peach skin, pale sage shirts, slate navy trousers and ivory/mint shoes; the laptop is silver blue. The inspector samples neutral skin below the front eyes for matching Rive eye backings. Color edits preserve transparent alpha.

Rive-native action accents: three colored orbit arcs, ten staggered glints, six landing motes and a delayed golden shockwave alongside the mint landing ring. All are hidden during idle and fade before the laptop action. These effects are part of the `.riv`, not CSS overlays.

## Placement

`PostCompanion` appears only on About (`/about`); the Post listing has no character. At viewport widths of 1280px and above it is fixed at the right edge, with its full hit area outside the centered 896px content column. On narrower screens it occupies its own right-aligned slot below the About introduction, without covering content. About uses the original `public/profile.jpeg` photo.

## Idle head scratch

`actions/color/scratch.png` adds six transparent hand-raising/scratching/lowering poses. After 5 seconds without pointer movement, the character scratches three times over 2.1 seconds and returns to gaze tracking. Pointer motion postpones the next idle action. A click interrupts scratching immediately in favor of the existing jump/laptop performance. Scratch does not disable the button or play jump effects. Reduced motion, offscreen and hidden tabs cancel both idle timers and playback. Timing is shared by the Rive generator and React through `idle-scratch.json`.
