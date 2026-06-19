import { Fragment } from 'react'
import { PencilLine } from 'lucide-react'

import { cn } from '@/lib/cn'
import type { PeopleRow as PeopleRowData } from '@/types'

import { VerticalSeparator } from './VerticalSeparator'

interface PeopleRowProps {
  people: PeopleRowData
  editable?: boolean
  /** Show only specific fields (e.g. requirement list shows Client only). */
  fields?: Array<'creator' | 'reviewer' | 'partner' | 'client'>
  className?: string
}

function formatNames(value: string | string[] | undefined): string | null {
  if (!value) return null
  return Array.isArray(value) ? value.join(' · ') : value
}

function PersonField({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <span className="font-semibold text-foreground">{label}:</span>
      <span className="font-normal text-[hsl(var(--person-name))]">{value}</span>
    </span>
  )
}

function EditLink() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-[hsl(var(--link))] hover:underline"
    >
      <PencilLine className="h-4 w-4" />
      Edit
    </button>
  )
}

export function PeopleRow({
  people,
  editable,
  fields,
  className,
}: PeopleRowProps) {
  const show = (key: 'creator' | 'reviewer' | 'partner' | 'client') =>
    !fields || fields.includes(key)

  const entries: Array<{ label: string; value: string | null }> = []
  if (show('creator'))
    entries.push({ label: 'Creator', value: formatNames(people.creator) })
  if (show('reviewer'))
    entries.push({ label: 'Reviewer', value: formatNames(people.reviewer) })
  if (show('partner'))
    entries.push({ label: 'Partner', value: formatNames(people.partner) })
  if (show('client'))
    entries.push({ label: 'Client', value: formatNames(people.client) })

  const visible = entries.filter((e) => e.value)
  if (visible.length === 0 && !editable) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2',
        className,
      )}
    >
      {visible.map((entry, i) => (
        <Fragment key={entry.label}>
          {i > 0 && <VerticalSeparator />}
          <PersonField label={entry.label} value={entry.value!} />
        </Fragment>
      ))}
      {editable && (
        <>
          {visible.length > 0 && <VerticalSeparator />}
          <EditLink />
        </>
      )}
    </div>
  )
}
