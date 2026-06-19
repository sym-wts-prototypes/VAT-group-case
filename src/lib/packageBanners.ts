import {
  getPackageBannerDescriptor,
  isPackageBannerPhase,
  packageFileNameForProcess,
  type PackageBannerDescriptor,
  type PackageBannerState,
} from '@/config/packageBanners'
import type { HeaderType, Phase, Platform, Process, Role } from '@/types'

export function showPackageBanner(
  headerType: HeaderType,
  platform: Platform,
  phase: Phase,
): boolean {
  return (
    headerType === 'case' &&
    platform === 'wts' &&
    isPackageBannerPhase(phase)
  )
}

export interface ResolvedPackageBanner {
  descriptor: PackageBannerDescriptor
  packageFileName: string
}

export function resolvePackageBanner(
  process: Process,
  phase: Phase,
  role: Role,
  state: PackageBannerState,
): ResolvedPackageBanner | null {
  if (!isPackageBannerPhase(phase)) return null

  const descriptor = getPackageBannerDescriptor(phase, role, state)
  if (!descriptor) return null

  return {
    descriptor,
    packageFileName: packageFileNameForProcess(process),
  }
}

export {
  defaultPackageReviewOutcome,
  isPackageBannerPhase,
  packageBannerStateFromOutcome,
  showPackageReviewControls,
  type PackageBannerState,
  type PackageReviewOutcome,
} from '@/config/packageBanners'
