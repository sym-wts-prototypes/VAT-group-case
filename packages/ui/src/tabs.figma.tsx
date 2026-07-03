/** Code Connect: WTS-ShadCn "Tabs" -> @wts/ui Tabs. */
import figma from '@figma/code-connect'
import { Tabs } from './tabs'

figma.connect(
  Tabs,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=15822-2956',
  {
    props: {
      variant: figma.enum('Style', {
        Button: 'button',
        Line: 'line',
      }),
    },
    example: ({ variant }) => (
      <Tabs
        variant={variant}
        label="Process"
        value="cit"
        options={[
          { value: 'cit', label: 'CIT', count: 12 },
          { value: 'hr', label: 'HR', count: 5 },
          { value: 'vat', label: 'VAT', count: 0 },
        ]}
        onChange={() => {}}
      />
    ),
  },
)
