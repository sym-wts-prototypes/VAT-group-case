/** Code Connect: WTS-ShadCn "Checkbox" -> @wts/ui CheckboxField. */
import figma from '@figma/code-connect'
import { CheckboxField } from './checkbox-field'

figma.connect(
  CheckboxField,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=46-112',
  {
    props: {
      label: figma.string('Label Text'),
      description: figma.boolean('Show Description', {
        true: figma.string('Description Text'),
        false: undefined,
      }),
      checked: figma.enum('Checked', { Yes: true, No: false }),
      disabled: figma.enum('State', { Default: false, Disabled: true }),
    },
    example: ({ label, description, checked, disabled }) => (
      <CheckboxField
        label={label}
        description={description}
        defaultChecked={checked}
        disabled={disabled}
      />
    ),
  },
)
