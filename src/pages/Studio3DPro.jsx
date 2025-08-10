import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Units
const FT_TO_M = 0.3048, IN_TO_M = 0.0254
const toMeters = (ft, in_=0)=> ft*FT_TO_M + in_*IN_TO_M
const fromMeters = (m)=>{ const totalIn=m/IN_TO_M; const ft=Math.floor(totalIn/12); const inch=Math.round(totalIn-ft*12); return {ft, inch} }
const fmtFtIn = (m)=>{ const {ft,inch}=fromMeters(m); return `${ft}'-${inch}"` }

// Materials (U W/m2K, EC kgCO2e/m2)
const MATERIALS=[
  { id:'wood-insul', name:'Timber stud + insulation', U:0.35, EC:35 },
  { id:'concrete',   name:'Concrete wall',            U:1.80, EC:180 },
  { id:'glass-loE',  name:'LoE Double Glazing',      U:1.70, EC:120 },
  { id:'roof-insul', name:'Insulated roof panel',     U:0.25, EC:40  },
]
const matById = id => MATERIALS.find(m=>m.id===id) || MATERIALS[0]

// Model schema
/*
mass: {
  id, x,y,w,d,h, wallMat, roofMat,
  openings: [ { wall:'N'|'S'|'E'|'W', x, z, w, h, mat } ]  // local wall coords
}
*/
const DEFAULT_MODEL = { gridMod: toMeters(4,0), masses: [], trees: [] }

// Sun (rough)
function sunDirection(latDeg, lonDeg, date){
  const lat=THREE.MathUtils.degToRad(latDeg)
  const d=date||new Date(); const doy=Math.floor((d-new Date(d.getFullYear(),0,0))/86400000)
  const dec=23.45*Math.sin(THREE.MathUtils.degToRad(360*(284+doy)/365)); const decl=THREE.MathUtils.degToRad(dec)
  const hour=d.getHours()+d.getMinutes()/60; const H=THREE.MathUtils.degToRad(15*(hour-12))
  const alt=Math.asin(Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos(H))
  const azi=Math.atan2(-Math.sin(H), Math.tan(decl)*Math.cos(lat)-Math.sin(lat)*Math.cos(H))
  const x=Math.sin(azi)*Math.cos(alt), y=Math.sin(alt), z=Math.cos(azi)*Math.cos(alt)
  return new THREE.Vector3(x,y,z).normalize()
}

// Proxies
const daylightFactorProxy = (windowArea, floorArea)=> floorArea<=0?0: Math.round((3*(1-Math.exp(-4*(windowArea/floorArea))))*100)/100
const glazingUA = (openings)=> openings.reduce((acc,o)=>{ const a=o.w*o.h; acc.area+=a; acc.UA += matById(o.mat||'glass-loE').U * a; return acc }, {area:0, UA:0})
const UA_for_mass = (m)=>{
  const wallMat=matById(m.wallMat), roofMat=matById(m.roofMat)
  const perim = 2*(m.w + m.d), wallArea = perim*m.h, roofArea = m.w*m.d
  return wallMat.U*wallArea + roofMat.U*roofArea
}
const hvacProxy=(UA_total,HDD=3000,CDD=800)=>({ heating:Math.round(UA_total*HDD*24/1000), cooling:Math.round(UA_total*CDD*12/1000) })
const lightingLoadProxy=(floorArea,lpd=8,df=2)=>{ const base=floorArea*lpd; const savings=Math.min(0.6, df/10); const avgW=base*(1-savings); return { avgW:Math.round(avgW), kWhYr:Math.round((avgW*12*300)/1000) } }
const windowSuggestionAI=(lat,orientDeg)=>{ const d=Math.min(180,Math.abs(180-((orientDeg%360)+360)%360)); const o=1-d/180; let wwr=0.25+0.2*(1-o); return Math.max(0.15,Math.min(0.45,Math.round(wwr*100)/100)) }

// Build wall meshes with Shape holes for openings
function buildMassGroup(mass){
  const g = new THREE.Group(); g.userData.massId = mass.id
  const wallMat = new THREE.MeshStandardMaterial({color:0xcbd5e1, side:THREE.DoubleSide})
  const roofMat = new THREE.MeshStandardMaterial({color:0xe2e8f0})
  const y0 = 0, y1 = mass.h

  // Walls: N(-Z), S(+Z), W(-X), E(+X)
  const walls=[
    {key:'N', w:mass.w, dir:new THREE.Vector3(0,0,-1), pos:new THREE.Vector3(mass.x+mass.w/2, y1/2, mass.y), rotY:0},
    {key:'S', w:mass.w, dir:new THREE.Vector3(0,0, 1), pos:new THREE.Vector3(mass.x+mass.w/2, y1/2, mass.y+mass.d), rotY:Math.PI},
    {key:'W', w:mass.d, dir:new THREE.Vector3(-1,0,0), pos:new THREE.Vector3(mass.x, y1/2, mass.y+mass.d/2), rotY:Math.PI/2},
    {key:'E', w:mass.d, dir:new THREE.Vector3( 1,0,0), pos:new THREE.Vector3(mass.x+mass.w, y1/2, mass.y+mass.d/2), rotY:-Math.PI/2},
  ]

  function makeWallPlane(width, height, openings){
    // wall plane centered; local coords x in [-w/2,w/2], y in [0,h]
    const shape = new THREE.Shape()
    shape.moveTo(-width/2, 0); shape.lineTo(width/2, 0); shape.lineTo(width/2, height); shape.lineTo(-width/2, height); shape.lineTo(-width/2, 0)
    openings.forEach(o=>{
      const ox = o.x - width/2
      const hole = new THREE.Path()
      hole.moveTo(ox, o.z)
      hole.lineTo(ox+o.w, o.z)
      hole.lineTo(ox+o.w, o.z+o.h)
      hole.lineTo(ox, o.z+o.h)
      hole.lineTo(ox, o.z)
      shape.holes.push(hole)
    })
    const geo = new THREE.ShapeGeometry(shape)
    const mesh = new THREE.Mesh(geo, wallMat)
    return mesh
  }

  walls.forEach(w=>{
    const ops = (mass.openings||[]).filter(o=>o.wall===w.key)
    const width = (w.key==='N'||w.key==='S') ? mass.w : mass.d
    const wall = makeWallPlane(width, mass.h, ops)
    wall.position.copy(w.pos)
    wall.rotation.y = w.rotY
    wall.userData = { massId: mass.id, wallKey:w.key, type:'wall' }
    g.add(wall)
  })

  // Roof (flat)
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(mass.w,mass.d), roofMat)
  roof.rotation.x = -Math.PI/2
  roof.position.set(mass.x+mass.w/2, y1, mass.y+mass.d/2)
  roof.userData = { massId: mass.id, type:'roof' }
  g.add(roof)

  return g
}

export default function Studio3DPro(){
  const mountRef = useRef(null)
  const sceneRef = useRef(), cameraRef=useRef(), rendererRef=useRef(), controlsRef=useRef()
  const groundRef = useRef(), gridRef=useRef(), sunRef=useRef()
  const ray = useRef(new THREE.Raycaster()); const mouse = useRef(new THREE.Vector2())

  const [model,setModel]=useState(DEFAULT_MODEL)
  const [lat,setLat]=useState(40.7),[lon,setLon]=useState(-74.0)
  const [time,setTime]=useState('13:00')
  const [gridFeet,setGridFeet]=useState(4)
  const [tool,setTool]=useState('draw') // draw | select | window | door | tree
  const [heightFt,setHeightFt]=useState(12)
  const [activeWallMat,setActiveWallMat]=useState('wood-insul')
  const [activeRoofMat,setActiveRoofMat]=useState('roof-insul')
  const [tmpRect,setTmpRect]=useState(null)
  const groupsRef = useRef({}) // massId -> Group

  useEffect(()=>{
    const mount = mountRef.current
    const w=mount.clientWidth, h=mount.clientHeight
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf5f7fb)
    const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 2000); camera.position.set(16,14,18)
    const renderer = new THREE.WebGLRenderer({antialias:true}); renderer.setSize(w,h); mount.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping=true

    const hemi = new THREE.HemisphereLight(0xe0f7ff, 0x777777, 0.7); scene.add(hemi)
    const sun = new THREE.DirectionalLight(0xffffff, 1.0); sun.position.set(20,30,20); sun.castShadow=true; scene.add(sun)
    const grid = new THREE.GridHelper(200, 200, 0x94a3b8, 0xe2e8f0); scene.add(grid)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshStandardMaterial({color:0xffffff}))
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground)

    sceneRef.current=scene; cameraRef.current=camera; rendererRef.current=renderer; controlsRef.current=controls
    groundRef.current=ground; gridRef.current=grid; sunRef.current=sun

    const onResize=()=>{ const W=mount.clientWidth, H=mount.clientHeight; renderer.setSize(W,H); camera.aspect=W/H; camera.updateProjectionMatrix() }
    window.addEventListener('resize', onResize)

    let raf
    const tick=()=>{ raf=requestAnimationFrame(tick); controls.update(); renderer.render(scene,camera) }
    tick()
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); mount.removeChild(renderer.domElement) }
  }, [])

  // site sun
  useEffect(()=>{
    if(!sunRef.current) return
    const [H,M] = time.split(':').map(x=>parseInt(x||'0'))
    const d=new Date(); d.setHours(H,M,0,0)
    const dir = sunDirection(lat, lon, d)
    sunRef.current.position.copy(dir.multiplyScalar(60))
  }, [lat,lon,time])

  // grid module
  useEffect(()=>{
    model.gridMod = toMeters(gridFeet,0)
  }, [gridFeet])

  // rebuild all meshes
  function refreshMeshes(){
    const scene=sceneRef.current; if(!scene) return
    // clear existing mass groups
    Object.values(groupsRef.current).forEach(g=>{ scene.remove(g); g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material && o.material.dispose) o.material.dispose() }) })
    groupsRef.current = {}
    model.masses.forEach(m=>{
      const g=buildMassGroup(m)
      scene.add(g); groupsRef.current[m.id]=g
    })
    // trees
    // (simple cones)
    model.trees?.forEach(t=>{
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1, t.h||2.4, 8), new THREE.MeshStandardMaterial({color:0x8d6e63})); trunk.position.set(t.x,(t.h||2.4)/2,t.y); scene.add(trunk)
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.9,1.8,12), new THREE.MeshStandardMaterial({color:0x5aa864})); crown.position.set(t.x,(t.h||2.4)+0.9,t.y); scene.add(crown)
    })
  }
  useEffect(()=>{ refreshMeshes() }, [model])

  // helpers
  function snap(v){
    const mod=model.gridMod||toMeters(4,0)
    return Math.round(v/mod)*mod
  }
  function groundPoint(e){
    const rect=rendererRef.current.domElement.getBoundingClientRect()
    mouse.current.x = ((e.clientX - rect.left)/rect.width)*2 - 1
    mouse.current.y = -((e.clientY - rect.top)/rect.height)*2 + 1
    ray.current.setFromCamera(mouse.current, cameraRef.current)
    const hit = ray.current.intersectObject(groundRef.current)
    return hit?.[0]?.point || null
  }
  function hitAny(e){
    const rect=rendererRef.current.domElement.getBoundingClientRect()
    mouse.current.x = ((e.clientX - rect.left)/rect.width)*2 - 1
    mouse.current.y = -((e.clientY - rect.top)/rect.height)*2 + 1
    ray.current.setFromCamera(mouse.current, cameraRef.current)
    // test all wall meshes in groups
    const meshes=[]
    Object.values(groupsRef.current).forEach(g=>g.traverse(o=>{ if(o.userData?.type==='wall' || o.userData?.type==='roof') meshes.push(o) }))
    const hit = ray.current.intersectObjects(meshes, true)
    return hit?.[0] || null
  }

  function wallKeyFromHit(hit){
    const key = hit?.object?.userData?.wallKey
    return key || null
  }

  function onMouseDown(e){
    if(tool==='draw'){
      const p = groundPoint(e); if(!p) return
      setTmpRect({ x:snap(p.x), y:snap(p.z), w:0, d:0 })
    } else if(tool==='window' || tool==='door'){
      const hit = hitAny(e); if(!hit) return alert('Click a wall to place.')
      const wallKey = wallKeyFromHit(hit); if(!wallKey) return alert('Not a wall.')
      const massId = hit.object.userData.massId
      const mass = model.masses.find(m=>m.id===massId); if(!mass) return
      // compute local coords on wall
      const wp = hit.point
      let localX=0, z=0, w=toMeters(tool==='door'?3:4,0), h=toMeters(tool==='door'?7:4,0)
      if(wallKey==='N' || wallKey==='S'){
        // wall spans X from mass.x..x+w, Z is height 0..h
        localX = THREE.MathUtils.clamp(wp.x - mass.x, 0, mass.w-w)
        z = THREE.MathUtils.clamp((tool==='door'?0:mass.h*0.5) - h/2, 0, Math.max(0, mass.h-h))
      }else{ // E/W spans Z
        localX = THREE.MathUtils.clamp(wp.z - mass.y, 0, mass.d-w)
        z = THREE.MathUtils.clamp((tool==='door'?0:mass.h*0.5) - h/2, 0, Math.max(0, mass.h-h))
      }
      const opening = { wall:wallKey, x:localX, z, w, h, mat:'glass-loE' }
      const newMass = {...mass, openings:[...(mass.openings||[]), opening]}
      setModel(m=>({...m, masses: m.masses.map(mm=> mm.id===mass.id? newMass:mm)}))
    } else if(tool==='select'){
      const hit = hitAny(e); if(!hit) return
      if(hit.object.userData?.type==='roof'){
        // start push/pull on height via mouse move
        pushing.current = { massId: hit.object.userData.massId, startY: hit.point.y, baseHeight: model.masses.find(m=>m.id===hit.object.userData.massId)?.h || 3 }
      }
    }
  }

  const pushing = useRef(null)
  function onMouseMove(e){
    if(tool==='draw' && tmpRect){
      const p = groundPoint(e); if(!p) return
      const x = Math.min(tmpRect.x, snap(p.x)), z = Math.min(tmpRect.y, snap(p.z))
      const w = Math.abs(snap(p.x) - tmpRect.x), d = Math.abs(snap(p.z) - tmpRect.y)
      setTmpRect({ x, y:z, w, d })
    } else if(tool==='select' && pushing.current){
      const p = groundPoint(e); if(!p) return
      const delta = p.y - pushing.current.startY // use world Y diff
      const mass = model.masses.find(m=>m.id===pushing.current.massId); if(!mass) return
      const newH = Math.max(toMeters(8,0), pushing.current.baseHeight + delta)
      const updated = {...mass, h:newH}
      setModel(m=>({...m, masses: m.masses.map(mm=> mm.id===mass.id? updated:mm)}))
    }
  }
  function onMouseUp(e){
    if(tool==='draw' && tmpRect){
      if(tmpRect.w>0.01 && tmpRect.d>0.01){
        const id = crypto.randomUUID()
        const mass = { id, x:tmpRect.x, y:tmpRect.y, w:tmpRect.w, d:tmpRect.d, h:toMeters(heightFt,0), wallMat:activeWallMat, roofMat:activeRoofMat, openings:[] }
        setModel(m=>({...m, masses:[...m.masses, mass]}))
      }
      setTmpRect(null)
    } else if(tool==='select' && pushing.current){
      pushing.current = null
    }
  }

  function addTree(){
    const t = { id:crypto.randomUUID(), x:0, y:toMeters(10,0), h:2.4 }
    setModel(m=>({...m, trees:[...(m.trees||[]), t]}))
  }

  // Metrics
  const floorArea = model.masses.reduce((s,m)=> s+m.w*m.d, 0)
  const allOpenings = model.masses.flatMap(m=>m.openings||[])
  const glz = glazingUA(allOpenings)
  const UA = model.masses.reduce((s,m)=> s + UA_for_mass(m), 0) + glz.UA
  const hvac = hvacProxy(UA)
  const df = daylightFactorProxy(glz.area, floorArea)
  const light = lightingLoadProxy(floorArea, 8, df)

  return (
    <main className="container">
      <div className="grid three">
        <div className="panel">
          <h3>Tools & Site</h3>
          <div className="row">
            <span className="badge">Tool</span>
            <select value={tool} onChange={e=>setTool(e.target.value)}>
              <option value="draw">Draw mass</option>
              <option value="select">Select / Push-Pull (roof)</option>
              <option value="window">Add Window (click wall)</option>
              <option value="door">Add Door (click wall)</option>
              <option value="tree">Plant Tree (button)</option>
            </select>
            <button className="btn outline" onClick={addTree}>+ Tree</button>
          </div>

          <label>Grid module</label>
          <div className="row">
            <input type="number" min="2" max="30" value={gridFeet} onChange={e=>setGridFeet(parseInt(e.target.value||4))} />
            <span className="small">feet</span>
          </div>

          <label>Mass default height</label>
          <div className="row">
            <input type="number" min="8" max="24" value={heightFt} onChange={e=>setHeightFt(parseInt(e.target.value||12))} />
            <span className="small">feet</span>
          </div>

          <label>Site latitude / longitude</label>
          <div className="row">
            <input type="number" value={lat} onChange={e=>setLat(parseFloat(e.target.value||0))} />
            <input type="number" value={lon} onChange={e=>setLon(parseFloat(e.target.value||0))} />
          </div>

          <label>Time</label>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} />

          <h3 style={{marginTop:16}}>Materials</h3>
          <label>Wall</label>
          <select value={activeWallMat} onChange={e=>setActiveWallMat(e.target.value)}>
            {MATERIALS.map(m=> <option key={m.id} value={m.id}>{m.name} (U={m.U})</option>)}
          </select>
          <label>Roof</label>
          <select value={activeRoofMat} onChange={e=>setActiveRoofMat(e.target.value)}>
            {MATERIALS.map(m=> <option key={m.id} value={m.id}>{m.name} (U={m.U})</option>)}
          </select>

          <div className="panel" style={{marginTop:12}}>
            <div className="kv"><div className="small">U → R</div><div className="small">R = 1/U (m²K/W)</div></div>
          </div>
        </div>

        <div className="panel">
          <div className="canvas-wrap"
            ref={mountRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          />
          {tmpRect && <div className="small" style={{marginTop:6}}>Drawing: {fmtFtIn(tmpRect.w)} × {fmtFtIn(tmpRect.d)} — h {heightFt}'</div>}
        </div>

        <div className="panel">
          <h3>Performance</h3>
          <div className="kv"><div className="small">Floor area</div><div className="small">{floorArea.toFixed(1)} m²</div></div>
          <div className="kv"><div className="small">Glazing area</div><div className="small">{glz.area.toFixed(1)} m²</div></div>
          <div className="kv"><div className="small">Daylight factor</div><div className="small">{df}%</div></div>
          <div className="kv"><div className="small">Lighting</div><div className="small">{light.avgW} W • {light.kWhYr} kWh/yr</div></div>
          <div className="kv"><div className="small">UA total</div><div className="small">{Math.round(UA)} W/K</div></div>
          <div className="kv"><div className="small">Heating/Cooling</div><div className="small">{hvac.heating} / {hvac.cooling} kWh/yr</div></div>

          <h3 style={{marginTop:16}}>Daylighting AI</h3>
          <div className="small">Suggest WWR ~{Math.round(windowSuggestionAI(lat,180)*100)}% on south; reduce east/west; add shading for hot climates.</div>
        </div>
      </div>
    </main>
  )
}
