import { useHashSync } from '@/store/useDemoStore'
import { PlaygroundView } from '@/views/PlaygroundView'

export function App() {
  useHashSync()

  return (
    <div className="flex min-h-full flex-col bg-muted/40">
      <main className="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
        <PlaygroundView />
      </main>
    </div>
  )
}
