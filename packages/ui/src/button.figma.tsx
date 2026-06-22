/**
 * Figma Code Connect mapping: WTS-ShadCn "Button" -> @wts/ui Button.
 * Publish with: npx figma connect publish --token=$FIGMA_TOKEN
 * (the WTS-ShadCn library must be published to a team library first).
 */
import figma from '@figma/code-connect'
import { Button } from './button'

figma.connect(
  Button,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=37-931',
  {
    props: {
      label: figma.string('Button Text'),
      variant: figma.enum('Variant', {
        Default: 'default',
        Secondary: 'secondary',
        Destructive: 'destructive',
        Outline: 'outline',
        Ghost: 'ghost',
        Link: 'link',
      }),
      size: figma.enum('Size', {
        default: 'default',
        sm: 'sm',
        lg: 'lg',
        icon: 'icon',
      }),
      // Figma encodes disabled as a State variant; map only that to the native prop.
      disabled: figma.enum('State', {
        Disabled: true,
        Default: false,
        Hover: false,
        Loading: false,
      }),
      leftIcon: figma.boolean('Show Left Icon', {
        true: figma.instance('Left Icon'),
        false: undefined,
      }),
      rightIcon: figma.boolean('Show Right Icon', {
        true: figma.instance('Right Icon'),
        false: undefined,
      }),
    },
    example: ({ label, variant, size, disabled, leftIcon, rightIcon }) => (
      <Button variant={variant} size={size} disabled={disabled}>
        {leftIcon}
        {label}
        {rightIcon}
      </Button>
    ),
  },
)
