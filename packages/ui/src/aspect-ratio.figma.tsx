/** Code Connect: WTS-ShadCn "Aspect Ratio" -> @wts/ui AspectRatio. */
import figma from '@figma/code-connect'
import { AspectRatio } from './aspect-ratio'

figma.connect(
  AspectRatio,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=28-1540',
  {
    props: {
      ratio: figma.enum('Ratio', {
        '1:1': 1,
        '5:4': 5 / 4,
        '4:3': 4 / 3,
        '3:2': 3 / 2,
        '16:10': 16 / 10,
        '1.618:1': 1.618,
        '16:9': 16 / 9,
        '2:1': 2,
        '21:9': 21 / 9,
        A4: 210 / 297,
        Letter: 8.5 / 11,
      }),
    },
    example: ({ ratio }) => (
      <AspectRatio ratio={ratio}>
        <img src="" alt="" className="h-full w-full rounded-md object-cover" />
      </AspectRatio>
    ),
  },
)
