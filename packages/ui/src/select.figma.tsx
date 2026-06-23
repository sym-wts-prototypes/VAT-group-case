/**
 * Figma Code Connect mapping: WTS-ShadCn "Select" -> @wts/ui SelectField.
 * The DS "Select" component IS the labeled field (label + info + description +
 * error state), so it maps to SelectField (which composes the bare Select).
 */
import figma from '@figma/code-connect'
import { SelectField } from './select-field'
import { SelectItem } from './select'

figma.connect(
  SelectField,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=345-11530',
  {
    props: {
      label: figma.boolean('Show Label', {
        true: figma.string('Label Text'),
        false: undefined,
      }),
      description: figma.boolean('Show Description', {
        true: figma.string('Description Text'),
        false: undefined,
      }),
      placeholder: figma.string('Placeholder'),
      info: figma.boolean('Info tooltip', { true: 'More information', false: undefined }),
      disabled: figma.enum('State', {
        Default: false,
        Focus: false,
        Disabled: true,
        Error: false,
      }),
      error: figma.enum('State', {
        Error: 'This field has an error.',
        Default: undefined,
        Focus: undefined,
        Disabled: undefined,
      }),
    },
    example: ({ label, description, placeholder, info, disabled, error }) => (
      <SelectField
        label={label}
        description={description}
        placeholder={placeholder}
        info={info}
        disabled={disabled}
        error={error}
      >
        <SelectItem value="option-1">Option 1</SelectItem>
        <SelectItem value="option-2">Option 2</SelectItem>
      </SelectField>
    ),
  },
)
