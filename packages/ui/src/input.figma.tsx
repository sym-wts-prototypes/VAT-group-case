/** Code Connect: WTS-ShadCn "Input" -> @wts/ui Input. */
import figma from '@figma/code-connect'
import { Input } from './input'

figma.connect(
  Input,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=65-533',
  {
    props: {
      placeholder: figma.string('Placeholder Text'),
      disabled: figma.enum('State', {
        Default: false,
        Focus: false,
        Filled: false,
        Disabled: true,
        Error: false,
      }),
    },
    example: ({ placeholder, disabled }) => <Input placeholder={placeholder} disabled={disabled} />,
  },
)
