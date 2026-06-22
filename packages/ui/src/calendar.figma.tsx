/** Code Connect: WTS-ShadCn "Calendar" -> @wts/ui Calendar. */
import figma from '@figma/code-connect'
import { Calendar } from './calendar'

figma.connect(
  Calendar,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=15533-1704',
  {
    example: () => <Calendar mode="single" />,
  },
)
