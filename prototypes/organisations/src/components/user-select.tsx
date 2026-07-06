import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Badge, Button, Input, Popover, PopoverContent, PopoverTrigger, cn } from '@wts/ui'

export interface SelectableUser {
  id: string
  name: string
  email: string
}

export interface UserSelectProps {
  id?: string
  users: SelectableUser[]
  value?: string
  onChange: (id: string | undefined) => void
  placeholder?: string
  'data-testid'?: string
}

// Single reusable searchable-combobox used for Creator, Reviewer, Partner, and Client —
// keeps all four "pick a person" fields on one interaction pattern instead of a Select for
// some and a checkbox list for others.
export function UserSelect({ id, users, value, onChange, placeholder = 'Search by name or email…', ...props }: UserSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = users.find((u) => u.id === value)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, query])

  const select = (userId: string) => {
    onChange(userId)
    setOpen(false)
    setQuery('')
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-header-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          )}
          {...props}
        >
          {selected ? (
            <Badge variant="fill" tone="default" size="sm" className="gap-1.5">
              {selected.name}
              <X className="size-3" onClick={clear} />
            </Badge>
          ) : (
            <span className="text-muted-foreground">{placeholder === 'Search by name or email…' ? 'Select…' : placeholder}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-8"
          />
        </div>
        <div className="mt-2 flex max-h-56 flex-col overflow-auto">
          {visible.length === 0 ? (
            <p className="px-2 py-3 text-center text-[13px] text-muted-foreground">No matches.</p>
          ) : (
            visible.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => select(u.id)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-accent',
                  u.id === value && 'bg-accent',
                )}
              >
                <span className="text-[13px] font-medium text-foreground">{u.name}</span>
                <span className="text-[12px] text-muted-foreground">{u.email}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
