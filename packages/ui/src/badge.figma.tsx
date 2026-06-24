/** Code Connect: WTS-ShadCn "Badge" -> @wts/ui Badge. */
import figma from '@figma/code-connect'
import { Badge } from './badge'

figma.connect(
  Badge,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=15108-18515',
  {
    props: {
      label: figma.string('Label'),
      variant: figma.enum('Style', {
        Fill: 'fill',
        Soft: 'soft',
      }),
      tone: figma.enum('Colour', {
        Default: 'default',
        Gray: 'gray',
        Red: 'red',
        Sky: 'sky',
        Orange: 'orange',
        Green: 'green',
        Violet: 'violet',
        Blue: 'blue',
      }),
      size: figma.enum('Size', {
        Default: 'sm',
        L: 'md',
        XL: 'lg',
      }),
    },
    example: ({ label, variant, tone, size }) => (
      <Badge variant={variant} tone={tone} size={size}>
        {label}
      </Badge>
    ),
  },
)
