# WTS Prototype Bridge (Figma plugin)

Recreates gallery screens as **editable** Figma frames (frames, text, boxes) from
the JSON exported by the gallery's “Send to Figma” / “Send flow to Figma” buttons.

## Build

```bash
pnpm --filter @wts/figma-plugin build   # bundles code.ts -> code.js
```

## Install in Figma (one-time, desktop app)

1. Figma → **Plugins → Development → Import plugin from manifest…**
2. Choose `figma-plugin/manifest.json` in this repo.

## Use

1. In the gallery, open a prototype:
   - a screen → **Send screen to Figma** (downloads `…figma.json`), or
   - the canvas → **Send flow to Figma** (downloads the whole flow as one file).
2. In Figma, run **Plugins → Development → WTS Prototype Bridge**.
3. Choose the downloaded `.json` (or paste it) → **Import**.

Each screen becomes a frame; a flow lays all frames out mirroring the canvas.

## Notes / limitations

- Fonts fall back to **Inter** when the prototype font (IBM Plex Sans) isn't
  installed in your Figma.
- Container `<div>`s become editable rectangles only when they have a visible
  fill or border; images import as placeholder rectangles (no network access).
- The result is meant to be **edited** in Figma, not a pixel-perfect rebuild.
