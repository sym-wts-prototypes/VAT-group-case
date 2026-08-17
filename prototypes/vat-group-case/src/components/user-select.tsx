import { useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Badge, Input, Popover, PopoverContent, PopoverTrigger, cn } from '@wts/ui'

export interface SelectableUser {
  id: string
  name: string
  email: string
}

interface UserSelectBaseProps {
  id?: string
  users: SelectableUser[]
  placeholder?: string
  'data-testid'?: string
}

export interface UserSelectSingleProps extends UserSelectBaseProps {
  multiple?: false
  value?: string
  onChange: (id: string | undefined) => void
}

export interface UserSelectMultiProps extends UserSelectBaseProps {
  multiple: true
  value: string[]
  onChange: (ids: string[]) => void
}

export type UserSelectProps = UserSelectSingleProps | UserSelectMultiProps

// Single reusable searchable-combobox used for Creator, Reviewer, Partner, and Client —
// keeps all four "pick a person" fields on one interaction pattern instead of a Select for
// some and a checkbox list for others. Partner is the only multi-select instance today.
export function UserSelect(props: UserSelectProps) {
  const { id, users, placeholder = 'Search by name or email…', multiple } = props
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedIds = multiple ? props.value : props.value ? [props.value] : []
  const selectedUsers = users.filter((u) => selectedIds.includes(u.id))

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, query])

  const select = (userId: string) => {
    if (multiple) {
      props.onChange(selectedIds.includes(userId) ? selectedIds : [...selectedIds, userId])
    } else {
      props.onChange(userId)
    }
    setOpen(false)
    setQuery('')
  }

  const remove = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple) {
      props.onChange(selectedIds.filter((id) => id !== userId))
    } else {
      props.onChange(undefined)
    }
  }

  const restProps = { 'data-testid': props['data-testid'] }

  return (
    <Popover
      open={open}
      // `modal` — this Popover lives inside the Create Case Sheet (a Radix Dialog). @wts/ui
      // pins `@radix-ui/react-dialog`/`@radix-ui/react-popover` as separate packages, which
      // pnpm resolves to two independent copies of `dismissable-layer`/`focus-scope` (verified
      // in pnpm-lock.yaml) — Dialog and Popover can't see each other's layer stack, so on the
      // very first click the Popover misclassifies the trigger's own pointerdown as "outside"
      // and immediately dismisses itself (the reported flicker/needs-two-clicks); the second
      // click "works" only because the first click's fallout has already settled. `modal` runs
      // this Popover's own self-contained layer/focus-trap instead of depending on that
      // cross-package coordination — the documented fix for Popover-in-Dialog in Radix/shadcn
      // (radix-ui/primitives#2121, #2348, #3079; shadcn-ui/ui#235).
      modal
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
            'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-header-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          )}
          {...restProps}
        >
          {selectedUsers.length > 0 ? (
            selectedUsers.map((u) => (
              <Badge key={u.id} variant="fill" tone="default" size="sm" className="gap-1.5">
                {u.name}
                <X className="size-3" onClick={(e) => remove(u.id, e)} />
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">Select…</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-2"
        // This Popover opens from inside the Create Case Sheet (a modal Radix Dialog). Radix's
        // own open-auto-focus and the Sheet's focus trap both try to claim focus the instant
        // this mounts — portaled to <body>, it's a DOM sibling of the Sheet's content despite
        // being visually nested, so the trap treats the focus move as "outside" and yanks it
        // straight back, which is what actually read as the reported flicker/needs-two-clicks
        // (the `autoFocus` this replaced was fighting the same trap). Focusing the input
        // directly here, after telling Radix not to run its own focus step, sidesteps the fight.
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          searchInputRef.current?.focus()
        }}
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
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
                  selectedIds.includes(u.id) && 'bg-accent',
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
