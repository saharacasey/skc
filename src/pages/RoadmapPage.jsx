import React from 'react'
export default function RoadmapPage(){
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h3 className="text-2xl font-bold">Development Roadmap</h3>
      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <div className="p-5 rounded-lg bg-white shadow-sm">
          <h4 className="font-semibold">Phase 1 — MVP</h4>
          <ul className="mt-2 text-sm text-slate-600">
            <li>Parametric grid editor</li><li>Basic solar index</li><li>Embodied carbon proxy</li>
          </ul>
        </div>
        <div className="p-5 rounded-lg bg-white shadow-sm">
          <h4 className="font-semibold">Phase 2 — AI & Integration</h4>
          <ul className="mt-2 text-sm text-slate-600">
            <li>AI-assisted options</li><li>Transient thermal proxy</li><li>Disassembly presets</li>
          </ul>
        </div>
        <div className="p-5 rounded-lg bg-white shadow-sm">
          <h4 className="font-semibold">Phase 3 — Scale</h4>
          <ul className="mt-2 text-sm text-slate-600">
            <li>BIM sync</li><li>Enterprise workspaces</li><li>Certification exports</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
