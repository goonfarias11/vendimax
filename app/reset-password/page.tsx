'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }

    fetch(`/api/auth/reset?token=${token}`)
      .then(r => r.json())
      .then(d => setStatus(d.valid ? 'valid' : 'invalid'))
      .catch(() => setStatus('invalid'))
  }, [token])

  async function handleSubmit() {
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'No se pudo actualizar la contraseña')
      } else {
        setStatus('success')
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f5' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#18181b' }}>
          Restablecer contraseña
        </h1>

        {status === 'loading' && (
          <p style={{ color: '#71717a' }}>Validando enlace...</p>
        )}

        {status === 'invalid' && (
          <>
            <p style={{ color: '#ef4444', marginBottom: '20px' }}>
              Este enlace es inválido o ya expiró. Los enlaces tienen una duración de 1 hora.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
            >
              Volver al login
            </button>
          </>
        )}

        {status === 'valid' && (
          <>
            <p style={{ color: '#71717a', marginBottom: '24px', fontSize: '14px' }}>
              Ingresá tu nueva contraseña.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            {error && (
              <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: '100%', padding: '11px', backgroundColor: submitting ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              {submitting ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </>
        )}

        {status === 'success' && (
          <>
            <p style={{ color: '#16a34a', marginBottom: '20px' }}>
              ✅ Tu contraseña fue actualizada correctamente.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
            >
              Ir al login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
