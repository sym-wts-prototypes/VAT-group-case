import { useRef, useState, type ReactNode } from 'react'
import { UploadCloud, Trash2 } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Tabs,
  Textarea,
  cn,
} from '@wts/ui'

import { Organization, OrgStatus } from './organizations-data'

export type PanelMode = 'create' | 'edit' | 'view'
type Tab = 'details' | 'activity'

interface PanelProps {
  mode: PanelMode
  org: Organization | null
  onClose: () => void
  onSubmit: (data: { name: string; description: string; status: OrgStatus; logoUrl?: string }) => void
}

export function OrganizationPanel({ mode, org, onClose, onSubmit }: PanelProps) {
  const [name, setName] = useState(org?.name ?? '')
  const [description, setDescription] = useState(org?.description ?? '')
  const [status] = useState<OrgStatus>(org?.status ?? 'Active')
  const [logoUrl, setLogoUrl] = useState<string | undefined>(org?.logoUrl)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<Tab>('details')
  const fileRef = useRef<HTMLInputElement>(null)

  const isEdit = mode === 'edit'
  const title = mode === 'create' ? 'Create Organization' : 'Edit Organization'

  function handleFile(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function submit() {
    if (!name.trim()) {
      setError(true)
      setTab('details')
      return
    }
    onSubmit({ name: name.trim(), description: description.trim(), status, logoUrl })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[560px] gap-0 p-0">
        <DialogHeader className="space-y-0 border-b border-border px-6 pt-5 pb-0">
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? 'Edit organization details' : 'Create a new organization'}
          </DialogDescription>
          {isEdit && (
            <Tabs
              variant="line"
              value={tab}
              onChange={(v) => setTab(v as Tab)}
              options={[
                { value: 'details', label: 'Details' },
                { value: 'activity', label: 'Activity log' },
              ]}
              className="-mb-px pt-3"
            />
          )}
        </DialogHeader>

        <div className="flex grow flex-col gap-5 overflow-auto px-6 py-5">
          {isEdit && tab === 'activity' ? (
            <ActivityLog org={org} />
          ) : (
            <>
              <Field label="Organization Name" required>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError(false)
                  }}
                  placeholder="e.g. Acme Corporation"
                  className={cn(error && 'border-destructive focus-visible:ring-destructive/30')}
                />
                {error && (
                  <span className="text-xs text-destructive">Organization name is required.</span>
                )}
              </Field>

              <Field label="Organization Description (optional)">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of the organization"
                  className="resize-none"
                />
              </Field>

              <Field label="Organization Logo">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    {logoUrl ? <AvatarImage src={logoUrl} alt="Logo preview" /> : null}
                    <AvatarFallback className="bg-primary font-display text-lg font-bold text-primary-foreground">
                      {(name.trim().slice(0, 1) || 'O').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      handleFile(e.dataTransfer.files?.[0])
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={cn(
                      'flex grow cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-3 py-4 text-center',
                      dragOver
                        ? 'border-brand bg-destructive/5'
                        : 'border-border hover:border-muted-foreground/30',
                    )}
                  >
                    <UploadCloud className="size-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      <span className="font-medium text-brand">Upload</span> or drag &amp; drop
                    </span>
                    <span className="text-[11px] text-muted-foreground/70">PNG, JPG up to 2MB</span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
                    />
                  </div>

                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setLogoUrl(undefined)}
                      aria-label="Remove logo"
                      className="shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </Field>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit}>
            {mode === 'create' ? 'Create Organization' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ActivityLog({ org }: { org: Organization | null }) {
  void org
  const entries = [
    { action: 'Organization details updated', actor: 'Sarah Klein', date: '28/05/2026 14:22' },
    { action: 'User anna.mueller@wts.com role changed to Contributor', actor: 'Super Admin', date: '21/05/2026 09:47' },
    { action: 'Engagement 09059 end date updated', actor: 'Sarah Klein', date: '14/05/2026 16:03' },
    { action: 'User lukas.schmidt@ea.com invited to Electronic Arts GmbH', actor: 'Anna Müller', date: '03/02/2026 11:18' },
    { action: 'Engagement 09059 added', actor: 'Sarah Klein', date: '12/01/2026 10:35' },
    { action: 'Declaration type CIT enabled for Electronic Arts GmbH', actor: 'Sarah Klein', date: '19/12/2025 08:51' },
    { action: 'VAT ID updated for Electronic Arts GmbH', actor: 'Sarah Klein', date: '08/12/2025 13:40' },
    { action: 'Tax authority changed to Köln-Altstadt', actor: 'Markus Weber', date: '27/11/2025 15:12' },
    { action: 'Legal entity Electronic Arts GmbH edited', actor: 'Sarah Klein', date: '20/11/2025 17:29' },
    { action: 'User julia.hoffmann@wts.com invited to Electronic Arts GmbH', actor: 'Sarah Klein', date: '06/10/2025 09:05' },
    { action: 'Fiscal year period set to 1 April – 31 March', actor: 'Sarah Klein', date: '22/09/2025 12:44' },
    { action: 'Legal entity Electronic Arts GmbH created', actor: 'Sarah Klein', date: '15/09/2024 10:00' },
    { action: 'Organization status set to Active', actor: 'System', date: '11/02/2024 08:30' },
    { action: 'Organization created', actor: 'System', date: '11/02/2024 08:30' },
  ]
  return (
    <div className="flex flex-col">
      {entries.map((e, i) => (
        <div
          key={i}
          className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-0"
        >
          <div className="flex flex-col">
            <span className="text-sm text-foreground">{e.action}</span>
            <span className="text-xs text-muted-foreground">{e.actor}</span>
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
            {e.date}
          </span>
        </div>
      ))}
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}
