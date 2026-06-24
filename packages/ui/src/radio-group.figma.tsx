/** Code Connect: WTS-ShadCn "Radio Group" -> @wts/ui RadioGroup. */
import figma from '@figma/code-connect'
import { RadioGroup, RadioGroupItem } from './radio-group'

figma.connect(
  RadioGroup,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=65-341',
  {
    props: {},
    example: () => (
      <RadioGroup defaultValue="option-one">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option-one" id="option-one" />
          <label htmlFor="option-one">Option One</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option-two" id="option-two" />
          <label htmlFor="option-two">Option Two</label>
        </div>
      </RadioGroup>
    ),
  },
)
