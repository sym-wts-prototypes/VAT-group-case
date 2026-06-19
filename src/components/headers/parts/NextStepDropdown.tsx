import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { NextStepMenuDescriptor } from '@/types'

interface NextStepDropdownProps {
  menu: NextStepMenuDescriptor
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

/**
 * Figma 5621:75896 — "Next step" primary with ChevronDown and option menu.
 */
export function NextStepDropdown({
  menu,
  disabled = false,
  size = 'lg',
  className,
}: NextStepDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="default"
        size={size}
        disabled={disabled}
        className="gap-2 px-8 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          if (!disabled) setOpen((value) => !value)
        }}
      >
        {menu.label}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            open && 'rotate-180',
          )}
        />
      </Button>

      {open && !disabled && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[280px] overflow-hidden rounded-lg border border-border bg-background p-1 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.05)]"
        >
          {menu.options.map((option) => (
            <button
              key={option.label}
              type="button"
              role="menuitem"
              className="flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setOpen(false)}
            >
              <span className="text-sm font-medium leading-5 text-foreground">
                {option.label}
              </span>
              {option.subtitle && (
                <span className="text-xs leading-4 text-muted-foreground">
                  {option.subtitle}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
