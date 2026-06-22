/** Code Connect: WTS-ShadCn "Textarea" -> @wts/ui Textarea. */
import figma from '@figma/code-connect'
import { Textarea } from './textarea'

figma.connect(
  Textarea,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=183-74',
  {
    props: {
      placeholder: figma.string('Placeholder Text'),
      disabled: figma.enum('State', {
        Default: false,
        Focus: false,
        Filled: false,
        Disabled: true,
      }),
    },
    example: ({ placeholder, disabled }) => <Textarea placeholder={placeholder} disabled={disabled} />,
  },
)
