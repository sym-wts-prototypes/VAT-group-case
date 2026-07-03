/**
 * Cross-prototype navigation helpers.
 * When invoked from inside an iframe (prototype embedded in gallery), navigate
 * the parent gallery window. Otherwise navigate the current window.
 */
export function navigateToPrototype(prototypeId: string) {
  const url = `/p/${prototypeId}`
  if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
    try {
      window.top.location.href = url
      return
    } catch {
      // cross-origin denied — fall through to current-window navigation
    }
  }
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}
