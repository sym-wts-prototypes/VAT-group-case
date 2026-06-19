import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Calendar,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  ListChecks,
  MessageSquareText,
  PencilLine,
  Plus,
  Send,
  type LucideIcon,
} from 'lucide-react'

import type { IconName } from '@/types'

const REGISTRY: Record<IconName, LucideIcon> = {
  ArrowRight,
  ArrowLeft,
  Send,
  Check,
  CheckCheck,
  ListChecks,
  Plus,
  BellRing,
  MessageSquareText,
  PencilLine,
  Calendar,
  Circle,
  ChevronRight,
}

interface IconProps {
  name: IconName
  className?: string
}

export function Icon({ name, className }: IconProps) {
  const Cmp = REGISTRY[name]
  if (!Cmp) return null
  return <Cmp className={className} />
}
