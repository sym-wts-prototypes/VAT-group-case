/**
 * Figma Code Connect mapping: WTS-ShadCn "Avatar" -> @wts/ui Avatar.
 * Publish with: npx figma connect publish --token=$FIGMA_TOKEN
 */
import figma from '@figma/code-connect'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'

figma.connect(
  Avatar,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=23-994',
  {
    example: () => (
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="" />
        <AvatarFallback>WT</AvatarFallback>
      </Avatar>
    ),
  },
)
