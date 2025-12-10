export const resolveApiBase = () => {
  const rawBase =
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.PROD ? '' : 'http://localhost:5001')

  if (!rawBase) return ''
  return rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
}

export const apiBase = resolveApiBase()
