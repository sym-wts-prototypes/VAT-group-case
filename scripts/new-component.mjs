// Scaffold a new @wts/ui component aligned to a DS component:
//   pnpm gen:component <Name> [figmaNodeId]
//   e.g. pnpm gen:component Tooltip 123:456
// Creates packages/ui/src/<kebab>.tsx + <kebab>.figma.tsx and adds the export to index.ts.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UI = path.join(root, 'packages/ui/src')
const FILE_KEY = process.env.FIGMA_FILE_KEY || 'UZi1uoOiqQtd0cE40PUzi6'

const rawName = process.argv[2]
const node = (process.argv[3] || '').replace(':', '-')
if (!rawName || !/^[A-Za-z][A-Za-z0-9]*$/.test(rawName)) {
  console.error('Usage: pnpm gen:component <PascalName> [figmaNodeId]')
  process.exit(1)
}
const Name = rawName[0].toUpperCase() + rawName.slice(1)
const kebab = Name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const comp = path.join(UI, `${kebab}.tsx`)
const mapping = path.join(UI, `${kebab}.figma.tsx`)
if (fs.existsSync(comp)) {
  console.error(`${kebab}.tsx already exists`)
  process.exit(1)
}

fs.writeFileSync(
  comp,
  `import * as React from 'react'

import { cn } from './cn'

export interface ${Name}Props extends React.HTMLAttributes<HTMLDivElement> {}

const ${Name} = React.forwardRef<HTMLDivElement, ${Name}Props>(
  ({ className, ...props }, ref) => (
    // TODO: implement to match the WTS-ShadCn "${Name}" component (themed by tokens).
    <div ref={ref} className={cn('', className)} {...props} />
  ),
)
${Name}.displayName = '${Name}'

export { ${Name} }
`,
)

const url = node
  ? `https://www.figma.com/design/${FILE_KEY}/WTS-ShadCn?node-id=${node}`
  : `https://www.figma.com/design/${FILE_KEY}/WTS-ShadCn?node-id=TODO`
fs.writeFileSync(
  mapping,
  `/** Code Connect: WTS-ShadCn "${Name}" -> @wts/ui ${Name}. */
import figma from '@figma/code-connect'
import { ${Name} } from './${kebab}'

figma.connect(
  ${Name},
  '${url}',
  {
    // TODO: map Figma props with figma.string / figma.enum / figma.boolean (see other *.figma.tsx).
    example: () => <${Name} />,
  },
)
`,
)

// Append the export to index.ts
const indexPath = path.join(UI, 'index.ts')
fs.appendFileSync(indexPath, `export { ${Name}, type ${Name}Props } from './${kebab}'\n`)

console.log(`Created:
  packages/ui/src/${kebab}.tsx        (component — implement it)
  packages/ui/src/${kebab}.figma.tsx  (Code Connect mapping — fill props${node ? '' : ' + node id'})
  + export added to packages/ui/src/index.ts

Next:
  1. Implement the component to match the DS.
  2. Add a catalog entry in apps/gallery/src/catalog/registry.tsx.
  3. pnpm lint && npx figma connect parse
  4. Publish: npx figma connect publish --force`)
