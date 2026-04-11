'use client'

import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/Toast'

type User = {
  id: string
  email: string
  role: string
  created_at: string
}

const roles = ['guest', 'host', 'admin'] as const

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    let isMounted = true

    async function loadUsers() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/admin/users')
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data?.error || 'Unable to load users.')
        }

        const data = await res.json()
        if (isMounted) {
          setUsers(data.users || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load users.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [])

  const canShowEmptyState = !loading && users.length === 0 && !error

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0))
  }, [users])

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSaving(prev => ({ ...prev, [userId]: true }))

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to update role.')
      }

      setUsers(current =>
        current.map(user =>
          user.id === userId
            ? {
                ...user,
                role: newRole,
              }
            : user,
        ),
      )

      toast.success('User role updated successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update role.')
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }))
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Admin Users Management</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            View and update registered user roles in a clean admin interface.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between gap-4 pb-4">
          <div>
            <p className="text-sm font-medium text-gray-300">Admin controls</p>
            <p className="text-xs text-gray-500">Change user role values directly from this table.</p>
          </div>
          {loading && (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-gray-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              Loading users...
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : canShowEmptyState ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-gray-400">
            No users were found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-950/95">
                <tr>
                  <th className="px-5 py-4 font-medium text-gray-400">Email</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Role</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Created</th>
                  <th className="px-5 py-4 font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map(user => (
                  <tr key={user.id} className="border-t border-white/10 last:border-b last:border-white/10">
                    <td className="px-5 py-4 align-middle text-white">{user.email}</td>
                    <td className="px-5 py-4 align-middle text-gray-200">
                      <select
                        value={user.role}
                        onChange={event => handleRoleChange(user.id, event.target.value)}
                        disabled={saving[user.id]}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
                      >
                        {roles.map(role => (
                          <option key={role} value={role} className="bg-slate-950 text-white">
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 align-middle text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4 align-middle text-sm text-gray-400">
                      {saving[user.id] ? 'Saving…' : 'Ready'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
