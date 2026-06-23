/** Code Connect: WTS-ShadCn "Switch" -> @wts/ui SwitchField. */
import figma from '@figma/code-connect'
import { SwitchField } from './switch-field'

figma.connect(
  SwitchField,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=60-450',
  {
    props: {
      label: figma.string('Switch Text'),
      description: figma.boolean('Show Description', {
        true: figma.string('Description Text'),
        false: undefined,
      }),
      checked: figma.enum('Active', { Yes: true, No: false }),
      disabled: figma.enum('Disabled', { Yes: true, No: false }),
      labelPosition: figma.enum('Text Left', { Yes: 'left', No: 'right' }),
    },
    example: ({ label, description, checked, disabled, labelPosition }) => (
      <SwitchField
        label={label}
        description={description}
        defaultChecked={checked}
        disabled={disabled}
        labelPosition={labelPosition}
      />
    ),
  },
)
