/** Code Connect: WTS-ShadCn "Alert" -> @wts/ui Alert. */
import figma from '@figma/code-connect'
import { Alert } from './alert'

figma.connect(
  Alert,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=15212-762',
  {
    props: {
      variant: figma.enum('State', {
        Default: 'default',
        Info: 'info',
        Sucess: 'success',
        Warning: 'warning',
        Error: 'destructive',
      }),
      title: figma.string('Title'),
      subtitle: figma.string('Subtitle'),
      showTitle: figma.boolean('showTitle'),
      showSubtitle: figma.boolean('showSubtitle'),
      showBadge: figma.boolean('showBadge'),
      showButton: figma.boolean('showButton'),
      close: figma.boolean('Close'),
    },
    example: ({ variant, title, subtitle, showTitle, showSubtitle }) => (
      <Alert
        variant={variant}
        title={showTitle ? title : undefined}
      >
        {showSubtitle ? subtitle : undefined}
      </Alert>
    ),
  },
)
