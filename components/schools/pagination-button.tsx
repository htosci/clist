export default function PaginationButton({
  params,
  targetPage,
  disabled,
  children,
  basePath = '/schools',
}: {
  params: Record<string, string | undefined>,
  targetPage: number,
  disabled: boolean,
  children: React.ReactNode,
  basePath?: string,
}) {
  if (disabled) {
    return (
      <button disabled className="px-4 py-2 text-sm border rounded-md opacity-50 cursor-not-allowed bg-muted">
        {children}
      </button>
    )
  }

  const newParams = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined)
  )
  newParams.set('page', targetPage.toString())

  return (
    <a
      href={`${basePath}?${newParams.toString()}`}
      className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
    >
      {children}
    </a>
  )
}
