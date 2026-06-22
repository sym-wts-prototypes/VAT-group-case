/**
 * Figma Code Connect mapping: WTS-ShadCn "Select" -> @wts/ui Select (Radix compound).
 * Publish with: npx figma connect publish --token=$FIGMA_TOKEN
 *
 * The Figma component's Label / Description are layout concerns with no prop on
 * the @wts/ui Select primitive, so they're intentionally omitted. Placeholder and
 * the disabled state map directly.
 */
import figma from '@figma/code-connect'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

figma.connect(
  Select,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=345-11530',
  {
    props: {
      placeholder: figma.string('Placeholder'),
      disabled: figma.enum('State', {
        Disabled: true,
        Default: false,
        Focus: false,
        Error: false,
      }),
    },
    example: ({ placeholder, disabled }) => (
      <Select disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option-1">Option 1</SelectItem>
          <SelectItem value="option-2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
)
