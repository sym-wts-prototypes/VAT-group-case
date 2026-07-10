import { useHashSync } from '@/store/useDemoStore'
import { PlaygroundView } from '@/views/PlaygroundView'

export function App() {
  useHashSync()

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      <main className="flex min-h-0 flex-1 flex-col p-2">
        <PlaygroundView />
      </main>
    </div>
  )
}
