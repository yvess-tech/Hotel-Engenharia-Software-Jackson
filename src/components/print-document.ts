type PrintSection = {
  title: string
  headers: string[]
  rows: string[][]
}

// Print only the requested document. User-entered text is always HTML-escaped.
export default function printDocument(title: string, sections: PrintSection[]) {
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character]!,
    )
  const frame = document.createElement("iframe")
  frame.title = title
  frame.style.cssText =
    "position:fixed;width:1px;height:1px;bottom:0;right:0;border:0"
  frame.onload = () => {
    const target = frame.contentWindow
    if (!target) return
    target.addEventListener("afterprint", () => frame.remove(), { once: true })
    target.focus()
    target.print()
  }
  frame.srcdoc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escape(title)}</title><style>body{font:12px Arial,sans-serif;color:#172e26;padding:24px}h1{font-size:22px}h2{font-size:15px;margin-top:24px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd;text-align:left;overflow-wrap:anywhere}th{background:#f2f6f4}tr{break-inside:avoid}thead{display:table-header-group}@page{margin:12mm}</style></head><body><h1>${escape(title)}</h1><p>Hotel Pacaas Novos · Emitido em ${escape(new Date().toLocaleString("pt-BR"))}</p>${sections.map((section) => `<h2>${escape(section.title)}</h2><table><thead><tr>${section.headers.map((header) => `<th>${escape(header)}</th>`).join("")}</tr></thead><tbody>${section.rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`).join("")}</body></html>`
  document.body.appendChild(frame)
}
