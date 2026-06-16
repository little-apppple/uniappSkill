export function matchTags(templates, tags, mode = 'all') {
  if (!tags || tags.length === 0) return templates.slice()
  const wanted = tags.map(t => t.toLowerCase())
  return templates.filter(tpl => {
    const have = (tpl.tags || []).map(t => t.toLowerCase())
    if (mode === 'all') return wanted.every(w => have.includes(w))
    if (mode === 'any') return wanted.some(w => have.includes(w))
    if (mode === 'none') return !wanted.some(w => have.includes(w))
    throw new Error(`unknown match mode: ${mode}`)
  })
}

export function matchKeyword(templates, keyword) {
  if (!keyword) return templates.slice()
  const k = keyword.toLowerCase()
  return templates.filter(tpl =>
    tpl.id.toLowerCase().includes(k) ||
    (tpl.title || '').toLowerCase().includes(k)
  )
}
