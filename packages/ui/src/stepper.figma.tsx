/** Code Connect: WTS-ShadCn "Stepper" -> @wts/ui Stepper. */
import figma from '@figma/code-connect'
import { Stepper } from './stepper'

figma.connect(
  Stepper,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=15195-185990',
  {
    props: {},
    example: () => (
      <Stepper
        steps={[
          { label: 'Step 1', state: 'finished' },
          { label: 'Step 2', state: 'inProgress' },
          { label: 'Step 3', state: 'notStarted' },
        ]}
      />
    ),
  },
)
