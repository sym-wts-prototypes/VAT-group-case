import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">This page could not be found.</p>
      <Link to="/" className="text-sm font-medium text-[hsl(var(--link))] hover:underline">
        ← Back to the gallery
      </Link>
    </div>
  )
}
