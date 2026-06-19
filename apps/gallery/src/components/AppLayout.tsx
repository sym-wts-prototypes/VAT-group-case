import { Link, Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-foreground">
            W
          </span>
          <span className="font-display text-sm font-semibold tracking-tight">
            WTS Prototype Gallery
          </span>
        </Link>
        <Link
          to="/components"
          className="ml-auto text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Components
        </Link>
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
