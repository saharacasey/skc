import React from 'react'
export default function LandingPage(){
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <section className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h2 className="text-4xl font-extrabold">Design for climate. Build for circularity.</h2>
          <p className="mt-4 text-slate-600">An integrated web platform that guides architects from concept to completion — generating climate-responsive designs, simulating performance, and recommending modular, low-carbon materials.</p>
          <div className="mt-6" style={{display:'flex',gap:'1rem'}}>
            <a className="btn" href="/roadmap">See Roadmap</a>
            <a className="btn outline" href="/demo">Try Prototype</a>
          </div>
        </div>
        <div className="p-6 rounded-lg border shadow-sm bg-white">
          <div style={{height:256,border:'1px dashed #e5e7eb',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8'}}>Interactive 3D Preview Placeholder</div>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-white border"><p className="text-xs text-slate-500">Annual Energy</p><p className="font-semibold">~18 kWh/m²·yr</p></div>
            <div className="p-3 rounded-md bg-white border"><p className="text-xs text-slate-500">Embodied Carbon</p><p className="font-semibold">~120 kgCO₂e/m²</p></div>
          </div>
        </div>
      </section>
    </main>
  )
}
