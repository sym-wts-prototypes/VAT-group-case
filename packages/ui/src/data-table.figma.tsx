/** Code Connect: WTS-ShadCn "Data Table" -> @wts/ui DataTable. */
import figma from '@figma/code-connect'
import { DataTable } from './data-table'

figma.connect(
  DataTable,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=327-695',
  {
    // DataTable is generic: pass your TanStack `columns` and `data`.
    example: () => <DataTable columns={[]} data={[]} />,
  },
)
