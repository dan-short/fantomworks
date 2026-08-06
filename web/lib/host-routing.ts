const ROOT_BY_SUBDOMAIN: Record<string, string> = {
  submit: '/submit',
  log: '/calls',
}

export function hostRootPath(host: string | null, pathname: string) {
  if (pathname !== '/') return null
  const subdomain = host?.split(':')[0].split('.')[0].toLowerCase()
  if (!subdomain) return null
  return ROOT_BY_SUBDOMAIN[subdomain] ?? null
}
