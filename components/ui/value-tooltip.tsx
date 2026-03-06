interface ValueTooltipProps {
  tooltip?: string
  children: React.ReactNode
}

export function ValueTooltip({ tooltip, children }: ValueTooltipProps) {
  if (!tooltip) return <>{children}</>
  return <span title={tooltip} className="cursor-help">{children}</span>
}
