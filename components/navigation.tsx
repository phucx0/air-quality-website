"use client"

import Link from "next/link"
import { Wind } from "lucide-react"

export function Navigation() {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Wind className="h-5 w-5 text-white" />
            </div>
            <span className="text-white">
              AIR<span className="text-emerald-500">GUARD</span>
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
