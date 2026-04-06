'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Link, Trash2, Plus } from 'lucide-react'
import type { ShareToken } from '@/lib/types'

interface ShareLinkManagerProps {
  tokens: ShareToken[]
}

export default function ShareLinkManager({ tokens: initialTokens }: ShareLinkManagerProps) {
  const router = useRouter()
  const [tokens, setTokens] = useState(initialTokens)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function getShareUrl(token: string) {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SUPABASE_URL // fallback
    return `${base}/shared/${token}`
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/share-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Family' }),
      })
      if (!res.ok) throw new Error()
      const newToken: ShareToken = await res.json()
      setTokens((prev) => [newToken, ...prev])
      router.refresh()
    } catch {
      alert('Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    const res = await fetch(`/api/share-tokens?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTokens((prev) => prev.filter((t) => t.id !== id))
      router.refresh()
    }
  }

  async function handleCopy(token: ShareToken) {
    await navigator.clipboard.writeText(getShareUrl(token.token))
    setCopiedId(token.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Family Access
        </h2>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {creating ? 'Creating…' : 'New link'}
        </button>
      </div>

      {tokens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 p-6 text-center">
          <Link className="h-6 w-6 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No share links yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Create a link to let family view your flights without logging in
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3"
            >
              <Link className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-300">{token.label}</p>
                <p className="text-xs text-gray-600 truncate">{getShareUrl(token.token)}</p>
              </div>
              <button
                onClick={() => handleCopy(token)}
                className="shrink-0 text-gray-400 hover:text-white transition-colors"
                title="Copy link"
              >
                {copiedId === token.id ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleRevoke(token.id)}
                className="shrink-0 text-gray-600 hover:text-red-400 transition-colors"
                title="Revoke link"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
