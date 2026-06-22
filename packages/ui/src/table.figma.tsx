/** Code Connect: WTS-ShadCn "Table" -> @wts/ui Table. */
import figma from '@figma/code-connect'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './table'

figma.connect(
  Table,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=501-80592',
  {
    example: () => (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>CIT-2847</TableCell>
            <TableCell>In Review</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
)
