/**
 * Figma REST pull client (read-only). The token is a Figma personal access
 * token and must stay SERVER-SIDE (a worker route or a build script) — never
 * ship it in the client bundle.
 */
const API = 'https://api.figma.com/v1'

export interface FigmaClient {
  getFile(fileKey: string): Promise<unknown>
  getNodes(fileKey: string, ids: string[]): Promise<unknown>
  /** Returns a map of node id -> rendered image URL. */
  getImages(
    fileKey: string,
    ids: string[],
    opts?: { format?: 'png' | 'svg' | 'jpg'; scale?: number },
  ): Promise<Record<string, string>>
  getLocalVariables(fileKey: string): Promise<unknown>
}

export function createFigmaClient(token: string): FigmaClient {
  if (!token) throw new Error('Figma token is required')
  const headers = { 'X-Figma-Token': token }

  async function get(path: string): Promise<any> {
    const res = await fetch(`${API}${path}`, { headers })
    if (!res.ok) throw new Error(`Figma API ${res.status} for ${path}: ${await res.text()}`)
    return res.json()
  }

  return {
    getFile: (fileKey) => get(`/files/${fileKey}`),
    getNodes: (fileKey, ids) => get(`/files/${fileKey}/nodes?ids=${ids.join(',')}`),
    async getImages(fileKey, ids, opts) {
      const format = opts?.format ?? 'png'
      const scale = opts?.scale ?? 2
      const data = await get(
        `/images/${fileKey}?ids=${ids.join(',')}&format=${format}&scale=${scale}`,
      )
      return (data?.images ?? {}) as Record<string, string>
    },
    getLocalVariables: (fileKey) => get(`/files/${fileKey}/variables/local`),
  }
}
