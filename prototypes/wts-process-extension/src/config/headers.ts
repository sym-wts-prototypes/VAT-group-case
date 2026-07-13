/**
 * ════════════════════════════════════════════════════════════════════════
 *  HEADER CONFIG - SINGLE SOURCE OF TRUTH
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Every label, action, badge, and people-line for every header in the app
 *  is decided by this file. The header components are dumb renderers - the
 *  rules live here.
 *
 *  HOW TO ADD A RULE
 *  -----------------
 *  Each entry is keyed `{process}.{headerType}.{phase}.{role}` and returns
 *  a partial HeaderDescriptor. The resolver merges the partial with a
 *  process-level default to produce the final descriptor.
 *
 *  - Want to change CIT Creator's "Send for review" label? Edit
 *    CONFIG.cit.case.inPreparation.creator.actions.primary.label
 *  - Want HR to behave differently from CIT in `inReview` for the Partner?
 *    Add CONFIG.hr.case.inReview.partner with a different action.
 *
 *  Reviewer and Partner are read-only on WTS except Reviewer gets "Submit review"
 *  on case in In Review. No write secondaries like "Add requirement".
 *  Enforced in resolveHeader.ts.
 *
 *  Client: no assignee Edit on people row; requirement bucket keeps Comments +
 *  Mark as done; case gets "Submit review" in Client Approval only. Enforced
 *  in resolveHeader.ts.
 *  - Anything not specified at the role level falls back to a process-wide
 *    default; anything not specified at the process level falls back to a
 *    cross-process default.
 *
 *  STRUCTURE
 *  ---------
 *      CONFIG: ProcessConfig per process
 *        .case            CaseHeaderConfig
 *           .{phase}      per-phase rules
 *              .{role}    per-role override
 *              .default   role-agnostic default
 *        .requirementList ...
 *        .requirementBucket ...
 *        .caseWrapper     HR only
 *
 *  The merge order is:  cross-process default
 *                    -> process default
 *                    -> headerType default
 *                    -> phase default
 *                    -> role override
 *
 *  ════════════════════════════════════════════════════════════════════════
 */

import { phaseForConfig } from '@/config/phases'

import {
  CASE_MANAGEMENT_BREADCRUMB,
  SAMPLE_CASE,
  SAMPLE_CASE_IDS,
  SAMPLE_CASE_TITLE,
  SAMPLE_HR_CASE_ID,
  SAMPLE_HR_CASE_TITLE,
  SAMPLE_HR_REQUEST_ID,
  SAMPLE_CLIENT_BUCKET_BACK,
  SAMPLE_CLIENT_BUCKET_TITLE,
  SAMPLE_PEOPLE,
  SAMPLE_REQUIREMENT_LIST_TITLE,
} from './sampleData'
import type {
  HeaderContext,
  HeaderDescriptor,
  Phase,
  Process,
  Role,
} from '@/types'

type DescriptorPartial = Partial<Omit<HeaderDescriptor, 'headerType'>>

type RoleMap = Partial<Record<Role | 'default', DescriptorPartial>>

type PhaseMap = Partial<Record<Phase, RoleMap>> & { default?: RoleMap }

interface HeaderTypeConfig {
  /** Applied to every (phase, role) for this header type. */
  base?: DescriptorPartial
  phases: PhaseMap
}

interface ProcessConfig {
  /** Applied to every header in this process. */
  base?: DescriptorPartial
  caseWrapper?: HeaderTypeConfig
  case: HeaderTypeConfig
  requirementList: HeaderTypeConfig
  requirementBucket: HeaderTypeConfig
}

/* -------------------------------------------------------------------------- */
/*  CIT                                                                       */
/* -------------------------------------------------------------------------- */

const CIT: ProcessConfig = {
  base: {
    people: SAMPLE_PEOPLE,
    dueDate: SAMPLE_CASE.dueDate,
    editable: true,
  },
  case: {
    base: {
      breadcrumb: [
        CASE_MANAGEMENT_BREADCRUMB,
        { label: SAMPLE_CASE_IDS.cit, current: true },
      ],
      title: {
        parts: SAMPLE_CASE_TITLE.cit,
        subtitle: SAMPLE_CASE.company,
      },
    },
    phases: {
      draft: {
        default: {
          actions: {
            primary: {
              label: 'Send to client',
              icon: 'ArrowRight',
              iconSide: 'right',
              variant: 'default',
            },
          },
        },
        client: {
          // Client header CTAs: enforced in resolveHeader (Submit review in Client Approval only).
          actions: {},
        },
      },
      inPreparation: {
        default: {
          actions: {
            primary: {
              label: 'Send for review',
              icon: 'ArrowRight',
              iconSide: 'right',
              variant: 'default',
            },
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
        reviewer: {
          actions: {
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
        partner: {
          actions: {
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
      },
      inReview: {
        default: {
          actions: {
            primary: {
              label: 'Send for approval',
              icon: 'ArrowRight',
              iconSide: 'right',
              variant: 'default',
            },
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
        creator: {
          // Creator can't act once it's in review - only see requirements.
          actions: {
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
        reviewer: {
          actions: {
            primary: {
              label: 'Submit review',
              icon: 'Check',
              iconSide: 'right',
              variant: 'default',
            },
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
        partner: {
          actions: {
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
      },
      clientApproval: {
        default: {
          actions: {
            primary: {
              label: 'Submit to tax authorities',
              icon: 'ArrowRight',
              iconSide: 'right',
              variant: 'default',
            },
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
        client: {
          actions: {
            primary: {
              label: 'Submit review',
              icon: 'Check',
              iconSide: 'right',
              variant: 'default',
            },
          },
        },
      },
      submitted: {
        default: {
          actions: {
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
        creator: {
          actions: {
            primary: {
              label: 'Tax assessment',
              icon: 'ArrowRight',
              iconSide: 'right',
              variant: 'default',
            },
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
      },
      // CIT-only post-submission stage: tracking tax assessments + moving to the summary.
      assessmentClosure: {
        default: {
          actions: {
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
        // Only the creator can advance the phase; the CTA navigates to the summary.
        creator: {
          actions: {
            primary: {
              label: 'Go to summary',
              icon: 'ArrowRight',
              iconSide: 'right',
              variant: 'default',
            },
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
      },
      // CIT terminal stage: read-only summary after the case is closed.
      summary: {
        default: {
          actions: {
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
      },
    },
  },
  requirementList: {
    base: {
      backLink: { label: 'Back', href: '#' },
      title: { plain: SAMPLE_REQUIREMENT_LIST_TITLE },
      dueDate: SAMPLE_CASE.dueDate,
      editable: true,
      people: { client: SAMPLE_PEOPLE.client },
    },
    phases: {
      open: {
        default: {
          actions: {
            secondary: [
              { label: 'Add requirement', icon: 'Plus', variant: 'outline' },
            ],
          },
        },
      },
      inProgress: {
        default: {
          // Send reminder only when workflow phase is In Preparation (see resolveHeader).
          actions: {
            primary: {
              label: 'Send reminder',
              icon: 'BellRing',
              iconSide: 'right',
              variant: 'default',
            },
            secondary: [
              { label: 'Add requirement', icon: 'Plus', variant: 'outline' },
            ],
          },
        },
      },
      completed: {
        default: {
          actions: {},
        },
      },
    },
  },
  requirementBucket: {
    base: {
      backLink: { label: SAMPLE_CLIENT_BUCKET_BACK, href: '#' },
      title: { plain: SAMPLE_CLIENT_BUCKET_TITLE },
      dueDate: SAMPLE_CASE.dueDate,
      people: undefined,
    },
    phases: {
      open: {
        default: {
          actions: {
            secondary: [
              { label: 'Comments', icon: 'MessageSquareText', variant: 'outline' },
            ],
            primary: {
              label: 'Mark as done',
              variant: 'outline',
            },
          },
        },
        client: {
          actions: {
            secondary: [
              { label: 'Comments', icon: 'MessageSquareText', variant: 'outline' },
            ],
            primary: {
              label: 'Mark as done',
              variant: 'outline',
            },
          },
        },
      },
      inProgress: {
        default: {
          actions: {
            secondary: [
              { label: 'Comments', icon: 'MessageSquareText', variant: 'outline' },
            ],
            primary: {
              label: 'Mark as done',
              variant: 'outline',
            },
          },
        },
        client: {
          actions: {
            secondary: [
              { label: 'Comments', icon: 'MessageSquareText', variant: 'outline' },
            ],
            primary: {
              label: 'Mark as done',
              variant: 'outline',
            },
          },
        },
      },
      completed: {
        default: {
          actions: {
            secondary: [
              { label: 'Comments', icon: 'MessageSquareText', variant: 'outline' },
            ],
          },
        },
        client: {
          actions: {
            secondary: [
              { label: 'Comments', icon: 'MessageSquareText', variant: 'outline' },
            ],
          },
        },
      },
    },
  },
}

/* -------------------------------------------------------------------------- */
/*  HR                                                                        */
/*  HR is the only process with a Case Wrapper layer.                         */
/*  Case-level rules currently mirror CIT - diverge below as needed.          */
/* -------------------------------------------------------------------------- */

const HR: ProcessConfig = {
  base: CIT.base,
  caseWrapper: {
    base: {
      breadcrumb: [
        CASE_MANAGEMENT_BREADCRUMB,
        { label: SAMPLE_HR_CASE_ID, current: true },
      ],
      title: {
        parts: SAMPLE_CASE_TITLE.hr,
        subtitle: SAMPLE_CASE.company,
      },
    },
    phases: {
      draft: {
        default: {
          actions: {},
        },
        reviewer: {
          actions: {
            primary: {
              label: 'Open cases',
              icon: 'ArrowRight',
              iconSide: 'right',
              variant: 'default',
            },
          },
        },
        partner: {
          actions: {
            primary: {
              label: 'Open cases',
              icon: 'ArrowRight',
              iconSide: 'right',
              variant: 'default',
            },
          },
        },
      },
      inProgress: {
        default: {
          actions: {
            primary: {
              label: 'Open cases',
              icon: 'ArrowRight',
              iconSide: 'right',
              variant: 'default',
            },
          },
        },
      },
      completed: {
        default: {
          actions: {},
        },
      },
    },
  },
  case: {
    // No company/VAT pills under title (unlike case wrapper and CIT/VAT case).
    base: {
      breadcrumb: [
        CASE_MANAGEMENT_BREADCRUMB,
        { label: SAMPLE_HR_CASE_ID, href: '#' },
        { label: SAMPLE_HR_REQUEST_ID, current: true },
      ],
      title: {
        plain: SAMPLE_HR_CASE_TITLE,
      },
    },
    phases: {
      ...CIT.case.phases,
      inReview: {
        default: CIT.case.phases.inReview!.default,
        creator: {
          actions: {
            nextStep: {
              label: 'Next step',
              options: [
                {
                  label: 'Submit for approval',
                  subtitle: 'Client reviews before submission',
                },
                {
                  label: 'Submit to tax authorities',
                  subtitle: 'Skip client approval',
                },
              ],
            },
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
        reviewer: CIT.case.phases.inReview!.reviewer,
        partner: CIT.case.phases.inReview!.partner,
      },
      submitted: {
        default: CIT.case.phases.submitted!.default,
        creator: {
          actions: {
            primary: {
              label: 'Create follow-up',
              icon: 'Plus',
              iconSide: 'left',
              variant: 'default',
            },
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
      },
    },
  },
  requirementList: CIT.requirementList,
  requirementBucket: CIT.requirementBucket,
}

/* -------------------------------------------------------------------------- */
/*  VAT                                                                       */
/*  Currently cloned from CIT - diverge below once VAT-specific rules land.   */
/* -------------------------------------------------------------------------- */

const VAT: ProcessConfig = {
  base: CIT.base,
  case: {
    base: {
      breadcrumb: [
        CASE_MANAGEMENT_BREADCRUMB,
        { label: SAMPLE_CASE_IDS.vat, current: true },
      ],
      title: {
        parts: SAMPLE_CASE_TITLE.vat,
        subtitle: SAMPLE_CASE.company,
        subCode: SAMPLE_CASE.vatCode,
      },
    },
    phases: {
      ...CIT.case.phases,
      submitted: {
        default: CIT.case.phases.submitted!.default,
        creator: {
          actions: {
            primary: {
              label: 'Create correction',
              icon: 'Plus',
              iconSide: 'left',
              variant: 'default',
            },
            secondary: [
              { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
            ],
          },
        },
      },
    },
  },
  requirementList: CIT.requirementList,
  requirementBucket: CIT.requirementBucket,
}

/* -------------------------------------------------------------------------- */

export const CONFIG: Record<Process, ProcessConfig> = {
  cit: CIT,
  hr: HR,
  vat: VAT,
}

/**
 * Cross-process default that applies to every header. Useful when a label
 * (eg "Edit") is invariant across the entire app.
 */
export const GLOBAL_DEFAULT: DescriptorPartial = {
  editable: false,
}

export function configFor(
  ctx: Pick<HeaderContext, 'process' | 'headerType' | 'phase' | 'role'>,
): {
  global: DescriptorPartial
  process: DescriptorPartial | undefined
  headerType: DescriptorPartial | undefined
  phase: DescriptorPartial | undefined
  role: DescriptorPartial | undefined
} {
  const processConfig = CONFIG[ctx.process]
  const headerConfig =
    ctx.headerType === 'caseWrapper'
      ? processConfig.caseWrapper
      : processConfig[ctx.headerType]
  const phaseMap = headerConfig?.phases
  const configPhase = phaseForConfig(ctx.phase, ctx.headerType)
  const phaseEntry = phaseMap?.[configPhase]
  return {
    global: GLOBAL_DEFAULT,
    process: processConfig.base,
    headerType: headerConfig?.base,
    phase: phaseEntry?.default,
    role: phaseEntry?.[ctx.role],
  }
}
