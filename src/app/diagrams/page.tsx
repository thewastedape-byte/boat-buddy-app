'use client'
import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import NavBar from '@/components/NavBar'
import { DIAGRAMS, getDiagramsByCategory, DiagramEntry } from '@/lib/diagrams'

export default function DiagramsPage() {
  const [selected, setSelected] = useState<DiagramEntry | null>(null)
  const byCategory = getDiagramsByCategory()

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <Link href="/" className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          ← Chat
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
          📐 Marine Diagrams
        </h1>
        <p className="text-xs mb-5" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
          {DIAGRAMS.length} professional system diagrams. Tap to view full size.
        </p>

        {Object.entries(byCategory).map(([category, diagrams]) => (
          <div key={category} className="mb-6">
            <h2 className="text-xs uppercase tracking-wider mb-3 px-1"
              style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
              {category}
            </h2>
            <div className="flex flex-col gap-3">
              {diagrams.map(diagram => (
                <button key={diagram.id} onClick={() => setSelected(diagram)}
                  className="panel p-3 text-left w-full"
                  style={{ background: 'rgba(20,8,2,0.85)' }}>
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden"
                      style={{ background: '#fff', border: '1px solid rgba(198,139,58,0.4)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={diagram.svgPath} alt={diagram.title}
                        className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                        {diagram.title}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)', fontFamily: 'system-ui, sans-serif' }}>
                        {diagram.description.substring(0, 80)}...
                      </p>
                    </div>
                    <span className="text-amber-400 flex-shrink-0 mt-1" style={{ color: '#C68B3A' }}>▶</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Full-screen diagram modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.95)' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: 'rgba(20,8,2,0.98)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{selected.title}</p>
              <p className="text-xs mt-0.5" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>{selected.category}</p>
            </div>
            <button onClick={() => setSelected(null)}
              className="text-2xl px-3 py-1"
              style={{ color: 'rgba(245,240,232,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center"
            style={{ background: '#fff' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.svgPath} alt={selected.title}
              className="w-full max-w-2xl" style={{ objectFit: 'contain' }} />
          </div>
          <div className="px-4 py-3" style={{ background: 'rgba(20,8,2,0.98)', borderTop: '1px solid rgba(198,139,58,0.3)' }}>
            <p className="text-xs" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'system-ui, sans-serif' }}>
              {selected.description}
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(245,240,232,0.35)', fontFamily: 'Georgia, serif' }}>
              You can also ask Boat Buddy about this system in the chat for step-by-step diagnosis.
            </p>
          </div>
        </div>
      )}

      <NavBar />
    </div>
  )
}
