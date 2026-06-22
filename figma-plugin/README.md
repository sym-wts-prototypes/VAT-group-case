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

## Use (copy → paste, recommended)

1. In the gallery: a screen → **Copy screen to Figma**, or the canvas →
   **Copy flow to Figma**. (Both also offer a JSON download as a fallback.)
2. In Figma, run **Plugins → Development → WTS Prototype Bridge**.
3. Click **Paste & Import from clipboard** — done. (If your Figma build blocks
   clipboard reads, just `Cmd/Ctrl+V` into the box; it auto-imports. A file
   picker is there too.)

Each screen becomes a frame; a flow lays all frames out mirroring the canvas.

## Notes / limitations

- Fonts fall back to **Inter** when the prototype font (IBM Plex Sans) isn't
  installed in your Figma.
- Container `<div>`s become editable rectangles only when they have a visible
  fill or border; images import as placeholder rectangles (no network access).
- The result is meant to be **edited** in Figma, not a pixel-perfect rebuild.
