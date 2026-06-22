/** Code Connect: WTS-ShadCn "Drawer" -> @wts/ui Drawer. */
import figma from '@figma/code-connect'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from './drawer'
import { Button } from './button'

figma.connect(
  Drawer,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=244-2831',
  {
    props: {
      title: figma.string('Title Text'),
      description: figma.string('Description Text'),
    },
    example: ({ title, description }) => (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Open</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>Confirm</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
  },
)
