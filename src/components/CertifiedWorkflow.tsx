import { WORKFLOW_SECTION, WORKFLOW_STEPS } from '@/data/landingData'
import SectionHeading from '@/components/common/SectionHeading'
import MaterialIcon from '@/components/common/MaterialIcon'
import type { WorkflowStep } from '@/types/landing'

function WorkflowStepCard({ step }: { step: WorkflowStep }) {
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-metal bg-surface-card p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-2xl font-bold text-accent-red">{step.number}</span>
        <MaterialIcon name={step.icon} className="text-[20px] text-muted" />
      </div>
      <h3 className="font-sans text-base font-bold uppercase text-main">{step.title}</h3>
      <p className="font-body text-sm leading-relaxed text-muted">{step.description}</p>
      <span className="mt-auto pt-2 font-mono text-[11px] text-muted">{step.tag}</span>
    </div>
  )
}

export default function CertifiedWorkflow() {
  return (
    <section
      id="proceso"
      className="w-full border-y border-metal bg-surface-card px-4 py-16 md:px-8 lg:px-12"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
        <SectionHeading tag={WORKFLOW_SECTION.tag} title={WORKFLOW_SECTION.title} badge={WORKFLOW_SECTION.badge} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((step) => (
            <WorkflowStepCard key={step.id} step={step} />
          ))}
        </div>
      </div>
    </section>
  )
}
