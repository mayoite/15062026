import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  humanizeAuthError,
  isSuspendedAuthError,
} from '../lib/humanizeAuthError'
import { Button, Input } from './AuthControls'
import { sanitizeNextPath } from '@/lib/auth/plannerRedirect'
import {
  AuthShell,
  AuthHeading,
  AuthFieldLabel,
  AuthErrorBanner,
  AuthLinks,
} from './AuthShell'

const supabase = createClient()

/**
 * Wave 17A: login gets the same Linear/JSON-Crack idiom the rest of the
 * app moved to — gradient bg, centered card, wordmark at the top, and a
 * confident copy refresh ("Welcome back" beats the generic "Log in to
 * Buddycraft"). The form shape and supabase call are unchanged; only
 * presentation moves.
 */
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const next = sanitizeNextPath(params.get('next'))
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    let error: unknown = null
    try {
      const res = await supabase.auth.signInWithPassword({ email, password })
      error = res.error
    } catch (e) {
      error = e
    }
    setBusy(false)
    if (error) {
      if (isSuspendedAuthError(error)) {
        await supabase.auth.signOut().catch(() => {})
        router.replace('/suspended')
        return
      }
      setError(humanizeAuthError(error))
      return
    }
    if (onSuccess) {
      onSuccess();
    } else {
      router.replace(next)
    }
  }

  return (
    <>
      {error && <AuthErrorBanner id="login-form-error" message={error} />}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthFieldLabel htmlFor="login-email" label="Email">
          <Input
            id="login-email"
            ref={emailRef}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            invalid={!!error}
            aria-describedby={error ? 'login-form-error' : undefined}
          />
        </AuthFieldLabel>

        <AuthFieldLabel htmlFor="login-password" label="Password">
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            invalid={!!error}
            aria-describedby={error ? 'login-form-error' : undefined}
          />
        </AuthFieldLabel>

        <Button
          type="submit"
          variant="primary"
          disabled={busy}
          className="w-full py-2"
          leftIcon={
            busy ? (
              <Loader2
                size={14}
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : undefined
          }
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </>
  )
}

export function LoginPage() {
  return (
    <AuthShell documentTitle="Sign in">
      <AuthHeading title="Welcome back" subtitle="Sign in to your workspace." />
      <LoginForm />

      <AuthLinks>
        <Link
          href="/forgot"
          className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          Forgot password?
        </Link>
        <span className="text-gray-400 dark:text-gray-600">
          Need an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-[color:var(--color-blueprint-strong)] dark:text-[color:var(--color-blueprint)] hover:underline"
          >
            Sign up
          </Link>
        </span>
      </AuthLinks>
    </AuthShell>
  )
}



