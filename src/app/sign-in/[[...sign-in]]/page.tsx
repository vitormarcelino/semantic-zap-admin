"use client"

import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M11 2L3 11H9.5L9 18L17 9H10.5L11 2Z" fill="white" strokeLinejoin="round" />
    </svg>
  )
}

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSubmitting = fetchStatus === "fetching"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Step 1: set identifier
    const { error: createError } = await signIn.create({ identifier: email })
    if (createError) {
      setError(createError.message)
      return
    }

    // Step 2: submit password
    const { error: passwordError } = await signIn.password({ password })
    if (passwordError) {
      setError(passwordError.message)
      return
    }

    // Step 3: finalize — sets active session and navigates
    const { error: finalizeError } = await signIn.finalize({
      navigate: () => router.push("/dashboard"),
    })
    if (finalizeError) {
      setError(finalizeError.message)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0F1117] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/8 bg-[#1F2535] p-8">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00D060]">
              <BoltIcon />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold tracking-tight text-white">
                SemanticZap
              </h1>
              <p className="mt-0.5 text-sm text-white/38">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-white/50">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-white/8 bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#00D060]/50 focus:outline-none focus:ring-1 focus:ring-[#00D060]/30"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-white/50">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-white/8 bg-[#0F1117] px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:border-[#00D060]/50 focus:outline-none focus:ring-1 focus:ring-[#00D060]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D060] py-2.5 text-sm font-medium text-[#081a0e] transition-colors hover:bg-[#00A84F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
              )}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/38">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-[#00D060] hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
