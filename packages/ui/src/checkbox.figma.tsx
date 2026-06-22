/** Code Connect: WTS-ShadCn "Checkbox" -> @wts/ui Checkbox. */
import figma from '@figma/code-connect'
import { Checkbox } from './checkbox'

figma.connect(
  Checkbox,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=46-112',
  {
    props: {
      checked: figma.enum('Checked', { Yes: true, No: false }),
      disabled: figma.enum('State', { Default: false, Disabled: true }),
    },
    example: ({ checked, disabled }) => <Checkbox defaultChecked={checked} disabled={disabled} />,
  },
)
