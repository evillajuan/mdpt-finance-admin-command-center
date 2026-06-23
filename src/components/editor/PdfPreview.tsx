'use client'
import { useEffect, useRef, useState } from 'react'
import type { Invoice } from './EditorView'

export default function PdfPreview({ invoice }: { invoice?: Invoice }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!invoice) return
    setPage(1)
    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        const data = invoice.edited ? invoice.edited.slice() : new Uint8Array(await invoice.file.arrayBuffer())
        const pdf = await pdfjs.getDocument({ data }).promise
        if (cancelled) return
        setPages(pdf.numPages)
        const p = await pdf.getPage(1)
        const v = p.getViewport({ scale: 1.6 })
        const c = canvas.current
        if (!c) return
        c.width = v.width
        c.height = v.height
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (p.render as any)({ canvasContext: c.getContext('2d')!, viewport: v }).promise
        setError('')
      } catch {
        setError('Unable to render this PDF.')
      }
    })()
    return () => { cancelled = true }
  }, [invoice])

  useEffect(() => {
    if (!invoice || (page === 1 && pages === 1)) return
    ;(async () => {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const data = invoice.edited ? invoice.edited.slice() : new Uint8Array(await invoice.file.arrayBuffer())
      const pdf = await pdfjs.getDocument({ data }).promise
      const p = await pdf.getPage(page)
      const v = p.getViewport({ scale: 1.6 })
      const c = canvas.current
      if (c) {
        c.width = v.width
        c.height = v.height
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (p.render as any)({ canvasContext: c.getContext('2d')!, viewport: v }).promise
      }
    })()
  }, [page])

  if (!invoice) return (
    <section className="editor-empty min-h-0 bg-[var(--e-stone)]">
      <div>
        <div className="editor-icon">⌑</div>
        <p>Invoice preview</p>
        <small>Original and edited PDFs appear here.</small>
      </div>
    </section>
  )

  return (
    <section className="min-w-0 min-h-0 flex flex-col bg-[var(--e-stone)]">
      <div className="h-11 border-b border-[var(--e-rule)] bg-[var(--e-paper)] flex items-center px-4">
        <span className="editor-label">Preview</span>
        <div className="ml-auto editor-mono text-[10px] flex items-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(x => x - 1)} className="border-0 bg-transparent">‹</button>
          <span>PAGE {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(x => x + 1)} className="border-0 bg-transparent">›</button>
        </div>
      </div>
      <div className="editor-scroll flex-1 p-7 text-center">
        {error ? <p className="text-[var(--e-danger)]">{error}</p> : <canvas ref={canvas} className="inline-block bg-white shadow-[0_4px_20px_#0002] max-w-full h-auto" />}
      </div>
    </section>
  )
}
