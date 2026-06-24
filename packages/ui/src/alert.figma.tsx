/** Code Connect: WTS-ShadCn "Alert" -> @wts/ui Alert. */
import figma from '@figma/code-connect'
import { Alert } from './alert'

figma.connect(
  Alert,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=15212-762',
  {
    props: {
      variant: figma.enum('State', {
        Default: 'info',
        Info: 'info',
        Sucess: 'success',
        Warning: 'warning',
        Error: 'destructive',
      }),
      title: figma.string('Title'),
      description: figma.string('Description'),
    },
    example: ({ variant, title, description }) => (
      <Alert variant={variant} title={title}>
        {description}
      </Alert>
    ),
  },
)
