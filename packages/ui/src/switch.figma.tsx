/** Code Connect: WTS-ShadCn "Switch" -> @wts/ui Switch. */
import figma from '@figma/code-connect'
import { Switch } from './switch'

figma.connect(
  Switch,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=60-450',
  {
    props: {
      checked: figma.enum('Active', { Yes: true, No: false }),
      disabled: figma.enum('Disabled', { Yes: true, No: false }),
    },
    example: ({ checked, disabled }) => <Switch defaultChecked={checked} disabled={disabled} />,
  },
)
