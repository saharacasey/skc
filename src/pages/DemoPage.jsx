import React, { useRef, useState, useEffect } from 'react'

const DEFAULT_MATERIALS = [
  { id: 'insulated-wood', name: 'Insulated Wood Panel', uValue: 0.25, embodied: 40 },
  { id: 'concrete', name: 'Concrete (cast)', uValue: 1.2, embodied: 180 },
  { id: 'straw-bale', name: 'Straw Bale', uValue: 0.15, embodied: 25 },
  { id: 'cross-lam', name: 'Cross-Laminated Timber', uValue: 0.35, embodied: 60 },
  { id: 'glass', name: 'Glass Curtain Wall', uValue: 5.8, embodied: 200 }
]

function calcSolarIndex(lat, orientationDeg) {
  const latFactor = Math.max(0, 1 - Math.abs(lat) / 90)
  const orientDiff = Math.min(180, Math.abs(180 - ((orientationDeg % 360) + 360) % 360))
  const orientFactor = 1 - orientDiff / 180
  const score = Math.max(0, latFactor * (0.5 + 0.5 * orientFactor))
  return Math.round(score * 100) / 100
}

function calcOperationalProxy(uValue, areaPerFloor, storeys, HDD=3000, CDD=800) {
  const A = areaPerFloor * storeys
  const heating = uValue * A * HDD * 0.024
  const cooling = uValue * A * CDD * 0.012
  return Math.round((heating + cooling) * 10) / 10
}

export default function DemoPage(){
  const canvasRef = useRef(null)
  const [cols,setCols]=useState(4)
  const [rows,setRows]=useState(3)
  const [moduleSize,setModuleSize]=useState(6)
  const [storeys,setStoreys]=useState(2)
  const [orientation,setOrientation]=useState(180)
  const [latitude,setLatitude]=useState(40)
  const [materials]=useState(DEFAULT_MATERIALS)
  const [selectedMaterialId,setSelectedMaterialId]=useState(materials[0].id)
  const [modelName,setModelName]=useState('My Model')
  const [savedModels,setSavedModels]=useState(()=>{try{return JSON.parse(localStorage.getItem('sd_models')||'[]')}catch{return []}})

  useEffect(()=>{draw()},[cols,rows,moduleSize,storeys,orientation,selectedMaterialId,latitude])

  function draw(){
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext('2d')
    const w = canvas.width = 800, h = canvas.height = 480
    ctx.clearRect(0,0,w,h); ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,w,h)
    const margin=40, areaW=w-margin*2, areaH=h-margin*2, cellW=areaW/cols, cellH=areaH/rows
    const material = materials.find(m=>m.id===selectedMaterialId)
    for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){const x=margin+c*cellW,y=margin+r*cellH;ctx.fillStyle='#fff';ctx.strokeStyle='#d1d5db';ctx.fillRect(x,y,cellW-2,cellH-2);ctx.strokeRect(x,y,cellW-2,cellH-2);ctx.fillStyle='#334155';ctx.font='10px Inter, Arial';ctx.fillText(moduleSize+'m',x+6,y+14)}}
    // orientation arrow
    ctx.save(); ctx.translate(w-80,80); ctx.rotate((orientation-180)*Math.PI/180); ctx.fillStyle='#059669'; ctx.beginPath(); ctx.moveTo(0,-24); ctx.lineTo(12,8); ctx.lineTo(0,2); ctx.lineTo(-12,8); ctx.closePath(); ctx.fill(); ctx.restore();
    // summary
    ctx.fillStyle='#fff'; ctx.fillRect(20,h-110,w-40,80); ctx.strokeStyle='#e6e6e6'; ctx.strokeRect(20,h-110,w-40,80)
    const totalArea = cols*rows*moduleSize*moduleSize
    const grossArea = totalArea*storeys
    const embodied = Math.round((material.embodied * totalArea)*10)/10
    const solarIndex = calcSolarIndex(latitude, orientation)
    const opProxy = calcOperationalProxy(material.uValue, totalArea, storeys)
    ctx.fillStyle='#0f172a'; ctx.font='14px Inter, Arial'
    ctx.fillText('Model: '+modelName,36,h-90)
    ctx.fillText('Floors: '+storeys+' • Gross area: '+grossArea+' m²',36,h-70)
    ctx.fillText('Material: '+material.name+' • U='+material.uValue+' W/m²K • Embodied='+material.embodied+' kgCO₂e/m²',36,h-50)
    ctx.fillText('Embodied CO₂ (proxy): '+embodied+' kgCO₂e',420,h-90)
    ctx.fillText('Operational proxy: '+opProxy+' kWh/yr (approx)',420,h-70)
    ctx.fillText('Solar Index (relative): '+solarIndex,420,h-50)
  }

  function exportJSON(){
    const material = materials.find(m=>m.id===selectedMaterialId)
    const payload = {name:modelName,cols,rows,moduleSize,storeys,orientation,latitude,material,generatedAt:new Date().toISOString()}
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=modelName.replace(/\s+/g,'_')+'.json'; a.click(); URL.revokeObjectURL(url)
  }
  function exportPNG(){const canvas=canvasRef.current; if(!canvas) return; const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=modelName.replace(/\s+/g,'_')+'.png'; a.click()}
  function saveToLocal(){const material = materials.find(m=>m.id===selectedMaterialId); const item={id:Date.now(),name:modelName,cols,rows,moduleSize,storeys,orientation,latitude,material,createdAt:new Date().toISOString()}; const list=[item,...savedModels].slice(0,20); setSavedModels(list); localStorage.setItem('sd_models',JSON.stringify(list)); alert('Model saved locally.')}
  function loadModel(item){setModelName(item.name); setCols(item.cols); setRows(item.rows); setModuleSize(item.moduleSize); setStoreys(item.storeys); setOrientation(item.orientation); setLatitude(item.latitude); setSelectedMaterialId(item.material.id)}
  function clearSaved(){if(!confirm('Clear saved models?')) return; setSavedModels([]); localStorage.removeItem('sd_models')}

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h3 className="text-2xl font-bold">Interactive Model Builder (client-side)</h3>
      <p className="text-slate-600 mt-2">Everything runs in your browser. No external services.</p>
      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-md shadow-sm">
          <label className="text-sm">Model name</label>
          <input className="w-full mt-1" value={modelName} onChange={e=>setModelName(e.target.value)} />
          <label className="text-sm mt-3">Grid columns</label>
          <input type="range" min={1} max={12} value={cols} onChange={e=>setCols(parseInt(e.target.value))} /><div className="text-sm text-slate-600">{cols} columns</div>
          <label className="text-sm mt-3">Grid rows</label>
          <input type="range" min={1} max={8} value={rows} onChange={e=>setRows(parseInt(e.target.value))} /><div className="text-sm text-slate-600">{rows} rows</div>
          <label className="text-sm mt-3">Module size (m)</label>
          <input type="number" min={1} max={20} value={moduleSize} onChange={e=>setModuleSize(parseFloat(e.target.value))} className="w-full" />
          <label className="text-sm mt-3">Storeys</label>
          <input type="number" min={1} max={10} value={storeys} onChange={e=>setStoreys(parseInt(e.target.value))} className="w-full" />
          <label className="text-sm mt-3">Orientation (deg, 0=N, 180=S)</label>
          <input type="number" min={0} max={359} value={orientation} onChange={e=>setOrientation(parseInt(e.target.value))} className="w-full" />
          <label className="text-sm mt-3">Latitude (deg, -90 to 90)</label>
          <input type="number" min={-90} max={90} value={latitude} onChange={e=>setLatitude(parseFloat(e.target.value))} className="w-full" />
          <label className="text-sm mt-3">Material</label>
          <select className="w-full" value={selectedMaterialId} onChange={e=>setSelectedMaterialId(e.target.value)}>
            {materials.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="mt-4" style={{display:'flex',gap:'.5rem'}}>
            <button className="btn" onClick={exportJSON}>Export JSON</button>
            <button className="btn outline" onClick={exportPNG}>Export PNG</button>
          </div>
          <div className="mt-4" style={{display:'flex',gap:'.5rem'}}>
            <button className="btn" onClick={saveToLocal}>Save locally</button>
            <button className="btn outline" onClick={clearSaved}>Clear saved</button>
          </div>
        </div>
        <div className="md:col-span-2 bg-white p-4 rounded-md shadow-sm">
          <canvas ref={canvasRef} style={{width:'100%',borderRadius:8,border:'1px solid #e6e6e6'}}></canvas>
          <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm text-slate-600">
            <div className="p-3" style={{background:'#eef2ff',borderRadius:8}}>Cols x Rows: {cols} × {rows}</div>
            <div className="p-3" style={{background:'#eef2ff',borderRadius:8}}>Module: {moduleSize} m</div>
            <div className="p-3" style={{background:'#eef2ff',borderRadius:8}}>Storeys: {storeys}</div>
          </div>
          <div className="mt-3">
            <h4 className="font-semibold">Saved models</h4>
            {savedModels.length===0 ? <p className="text-sm text-slate-500">No saved models</p> : (
              <ul className="mt-2 text-sm">
                {savedModels.map(s=>(
                  <li key={s.id} className="flex items-center justify-between p-2 border rounded mt-2">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{display:'flex',gap:'.5rem'}}>
                      <button className="btn outline" onClick={()=>loadModel(s)}>Load</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
