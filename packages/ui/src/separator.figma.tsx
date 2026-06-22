/**
 * Figma Code Connect mapping: WTS-ShadCn "Separator" -> @wts/ui Separator.
 * Publish with: npx figma connect publish --token=$FIGMA_TOKEN
 */
import figma from '@figma/code-connect'
import { Separator } from './separator'

figma.connect(
  Separator,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=118-2690',
  {
    props: {
      orientation: figma.enum('Orientation', {
        Horizontal: 'horizontal',
        Vertical: 'vertical',
      }),
    },
    example: ({ orientation }) => <Separator orientation={orientation} />,
  },
)
