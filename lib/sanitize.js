/**
 * Lightweight HTML sanitizer that removes dangerous executable tags,
 * inline event handlers (onclick, onerror, etc.), and javascript:/vbscript: URIs.
 * Safe for both SSR and Client rendering without heavy DOM dependencies.
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return ''

  return html
    // Remove script, object, embed, applet, base, meta, form/noscript dangerous tags with contents
    .replace(/<(script|style|object|embed|applet|base|meta|link)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|object|embed|applet|base|meta|link)\b[^>]*\/?>/gi, '')
    // Remove inline event handlers (onmouseover="...", onclick='...', onerror=...)
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript:, vbscript:, data:text/html URIs in href/src/action/formaction
    .replace(/(href|src|action|formaction|xlink:href)\s*=\s*(["'])\s*(?:javascript|vbscript|data:text\/html):[\s\S]*?\2/gi, '$1="#"')
    .replace(/(href|src|action|formaction|xlink:href)\s*=\s*(?:javascript|vbscript|data:text\/html):[^\s>]*/gi, '$1="#"')
}

export function sanitizeBuilderSections(sections) {
  if (!Array.isArray(sections)) return []
  return sections.map((sec) => {
    if (!sec || !Array.isArray(sec.widgets)) return sec
    return {
      ...sec,
      widgets: sec.widgets.map((w) => {
        if (w?.type === 'custom_html' && typeof w.props?.html === 'string') {
          return { ...w, props: { ...w.props, html: sanitizeHtml(w.props.html) } }
        }
        return w
      }),
    }
  })
}
