import { Separator, cn } from '@wts/ui'

const FOOTER_LINKS = [
  {
    label: 'Imprint',
    href: 'https://wts.com/de-en/impressum',
    external: true,
  },
  { label: 'Data protection notice', href: '#' },
  { label: 'Cookies', href: '#' },
  { label: 'Terms & Conditions', href: '#' },
] as const

/** Figma WTS-ShadCn 15937:147 — app footer. */
export function WtsFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        'flex shrink-0 items-center gap-2 border-t border-border bg-primary-foreground px-4 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <span className="shrink-0 text-xs leading-none text-muted-foreground">
          © 2026 WTS Platform
        </span>
        {FOOTER_LINKS.map((link) => (
          <div key={link.label} className="flex items-center gap-3">
            <Separator orientation="vertical" className="h-5" />
            {'external' in link && link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs leading-none text-muted-foreground underline hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <a
                href={link.href}
                className="text-xs leading-none text-muted-foreground underline hover:text-foreground"
              >
                {link.label}
              </a>
            )}
          </div>
        ))}
      </div>
      <span className="shrink-0 text-xs leading-none text-muted-foreground">
        v1.00
      </span>
    </footer>
  )
}
