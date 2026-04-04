"use client"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"

type Step = "form" | "verify"

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M11 2L3 11H9.5L9 18L17 9H10.5L11 2Z" fill="white" strokeLinejoin="round" />
    </svg>
  )
}

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  show: boolean
  onToggle: () => void
}

function PasswordField({ id, label, value, onChange, autoComplete, show, onToggle }: PasswordFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-white/50">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-white/8 bg-[#0F1117] px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:border-[#00D060]/50 focus:outline-none focus:ring-1 focus:ring-[#00D060]/30"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
        </button>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp()
  const router = useRouter()

  const [step, setStep] = useState<Step>("form")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isSubmitting = fetchStatus === "fetching"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    const [firstName, ...rest] = name.trim().split(" ")

    // Step 1: create account with email
    const { error: createError } = await signUp.create({
      emailAddress: email,
      firstName,
      lastName: rest.join(" ") || undefined,
    })
    if (createError) {
      setError(createError.message)
      return
    }

    // Step 2: set password
    const { error: passwordError } = await signUp.password({ password })
    if (passwordError) {
      setError(passwordError.message)
      return
    }

    // Step 3: trigger email verification code
    const { error: sendError } = await signUp.verifications.sendEmailCode()
    if (sendError) {
      setError(sendError.message)
      return
    }

    setStep("verify")
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Verify the code
    const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code })
    if (verifyError) {
      setError(verifyError.message)
      return
    }

    // Finalize — sets active session and navigates
    const { error: finalizeError } = await signUp.finalize({
      navigate: () => router.push("/dashboard"),
    })
    if (finalizeError) {
      setError(finalizeError.message)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0F1117] px-4 py-8">
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
              <p className="mt-0.5 text-sm text-white/38">
                {step === "form" ? "Create your account" : "Verify your email"}
              </p>
            </div>
          </div>

          {step === "form" ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-medium text-white/50">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                  className="w-full rounded-lg border border-white/8 bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#00D060]/50 focus:outline-none focus:ring-1 focus:ring-[#00D060]/30"
                />
              </div>

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

              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                show={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />

              <PasswordField
                id="confirm-password"
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />

              {error && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Clerk CAPTCHA anchor — required for Smart CAPTCHA in custom flows */}
              <div id="clerk-captcha" />

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D060] py-2.5 text-sm font-medium text-[#081a0e] transition-colors hover:bg-[#00A84F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && (
                  <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                )}
                {isSubmitting ? "Creating account…" : "Create account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <p className="text-center text-sm text-white/50">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-white">{email}</span>
              </p>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="code" className="text-xs font-medium text-white/50">
                  Verification code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                  className="w-full rounded-lg border border-white/8 bg-[#0F1117] px-4 py-2.5 text-center font-mono text-xl tracking-[0.5em] text-white placeholder:text-white/20 focus:border-[#00D060]/50 focus:outline-none focus:ring-1 focus:ring-[#00D060]/30"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || code.length < 6}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D060] py-2.5 text-sm font-medium text-[#081a0e] transition-colors hover:bg-[#00A84F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && (
                  <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                )}
                {isSubmitting ? "Verifying…" : "Verify email"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("form")
                  setError(null)
                  setCode("")
                }}
                className="text-center text-xs text-white/38 transition-colors hover:text-white/60"
              >
                Back to sign up
              </button>
            </form>
          )}

          {step === "form" && (
            <p className="mt-6 text-center text-xs text-white/38">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#00D060] hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
