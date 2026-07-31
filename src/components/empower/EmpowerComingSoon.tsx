type EmpowerComingSoonProps = {
  title: string
  description?: string
}

export function EmpowerComingSoon({
  title,
  description = 'This section is being built.',
}: EmpowerComingSoonProps) {
  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-semibold text-[#1B2E4A]">{title}</h1>
      <p className="text-sm text-[#6B7280]">{description}</p>
    </div>
  )
}
