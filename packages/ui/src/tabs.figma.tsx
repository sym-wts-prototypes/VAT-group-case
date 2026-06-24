/** Code Connect: WTS-ShadCn "Tabs" -> @wts/ui Tabs. */
import figma from '@figma/code-connect'
import { Tabs, TabsList, TabsTrigger } from './tabs'

figma.connect(
  Tabs,
  'https://www.figma.com/design/UZi1uoOiqQtd0cE40PUzi6/WTS-ShadCn?node-id=15822-2956',
  {
    props: {},
    example: () => (
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
      </Tabs>
    ),
  },
)
