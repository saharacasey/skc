import React from 'react'
export default function FeaturesPage(){
  const items=[
    {t:'Climate-Responsive Massing',d:'Parametric tools + simple solar geometry for early options.'},
    {t:'Material Intelligence',d:'Built-in material library with U-values & embodied CO₂.'},
    {t:'Lifecycle Dashboard',d:'Embodied vs operational proxies for quick trade-offs.'},
    {t:'Reversible & Modular',d:'Design-for-disassembly presets & modular grids.'},
  ]
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h3 className="text-2xl font-bold">Key features</h3>
      <div className="mt-6 grid md:grid-cols-3 gap-6">
        {items.map(x=> (
          <div key={x.t} className="p-5 rounded-lg bg-white shadow-sm">
            <h4 className="font-semibold">{x.t}</h4>
            <p className="text-sm text-slate-600 mt-2">{x.d}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
