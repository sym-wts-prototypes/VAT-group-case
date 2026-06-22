/**
 * Figma Code Connect mapping: WTS-ShadCn "Card" -> @wts/ui Card.
 * Publish with: npx figma connect publish --token=$FIGMA_TOKEN
 */
import figma from '@figma/code-connect'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

figma.connect(
  Card,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=268-1190',
  {
    example: () => (
      <Card>
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    ),
  },
)
