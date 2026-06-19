// Client helpers for the worker's /__figma proxy (the token stays server-side).

export interface FigmaFrameRef {
  id: string
  name: string
  page: string
}

export type PullStatus = 'ok' | 'token-missing' | 'no-worker' | 'error'

export interface FramesResult {
  status: PullStatus
  frames: FigmaFrameRef[]
  message?: string
}

interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
}

async function getJson(url: string): Promise<{ status: number; data: any; isJson: boolean }> {
  const res = await fetch(url)
  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    // Gallery dev server (no worker) returns the SPA index.html instead.
    return { status: res.status, data: null, isJson: false }
  }
  return { status: res.status, data: await res.json(), isJson: true }
}

/** Top-level frames/components of a Figma file, grouped by page. */
export async function fetchFrames(fileKey: string): Promise<FramesResult> {
  let res: Awaited<ReturnType<typeof getJson>>
  try {
    res = await getJson(`/__figma/file?file=${encodeURIComponent(fileKey)}`)
  } catch (err) {
    return { status: 'error', frames: [], message: (err as Error).message }
  }
  if (!res.isJson) {
    return {
      status: 'no-worker',
      frames: [],
      message: 'Figma pull runs through the Cloudflare worker — use the preview or deployed build.',
    }
  }
  if (res.status === 503) return { status: 'token-missing', frames: [], message: res.data?.error }
  if (res.status >= 400) return { status: 'error', frames: [], message: res.data?.error ?? `HTTP ${res.status}` }

  const frames: FigmaFrameRef[] = []
  const pages: FigmaNode[] = res.data?.document?.children ?? []
  for (const page of pages) {
    for (const node of page.children ?? []) {
      if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        frames.push({ id: node.id, name: node.name, page: page.name })
      }
    }
  }
  return { status: 'ok', frames }
}

/** Render URLs (PNG) for the given node ids. */
export async function fetchFrameImages(
  fileKey: string,
  ids: string[],
): Promise<Record<string, string>> {
  if (!ids.length) return {}
  const res = await getJson(
    `/__figma/images?file=${encodeURIComponent(fileKey)}&ids=${ids.join(',')}`,
  )
  if (!res.isJson || res.status >= 400) return {}
  return (res.data ?? {}) as Record<string, string>
}
