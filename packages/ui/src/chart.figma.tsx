/** Code Connect: WTS-ShadCn "Chart" -> @wts/ui ChartContainer. */
import figma from '@figma/code-connect'
import { ChartContainer } from './chart'

figma.connect(
  ChartContainer,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=449-7503',
  {
    // ChartContainer wraps a recharts chart and themes series via a ChartConfig.
    example: () => (
      <ChartContainer config={{}}>
        <div />
      </ChartContainer>
    ),
  },
)
