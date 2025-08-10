import React from 'react'
export default function ContactPage(){
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="p-6 rounded-lg bg-white shadow-sm">
        <h3 className="text-2xl font-bold">Contact</h3>
        <p className="text-slate-600 mt-2">Ask for new features or help deploying.</p>
        <form className="mt-4" onSubmit={(e)=>{e.preventDefault(); alert('Form submitted (demo).')}}>
          <div className="grid md:grid-cols-3 gap-3">
            <input placeholder="Your name" />
            <input placeholder="Email" />
            <input placeholder="Company / role" />
          </div>
          <textarea className="mt-3" rows="4" placeholder="What would you like built?"></textarea>
          <div className="mt-3">
            <button className="btn">Send</button>
          </div>
        </form>
      </div>
    </main>
  )
}
