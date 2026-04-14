import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getSubscription } from "@/lib/billing/subscription"

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/billing(.*)",
  "/api/webhooks(.*)",
  "/api/billing(.*)",
  "/api/webhook(.*)",
  "/api/internal(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  // Protect all non-public routes with Clerk auth
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Skip subscription enforcement for public/billing routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.next()

  // Check subscription status
  let sub: Awaited<ReturnType<typeof getSubscription>>
  try {
    sub = await getSubscription(userId)
  } catch {
    // Redis unavailable — allow through rather than blocking all users
    return NextResponse.next()
  }

  if (!sub) return NextResponse.next()

  const { status } = sub

  // Blocked or trial ended — hard enforcement
  if (status === "blocked" || status === "trial_ended") {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "subscription_required", status, reason: status },
        { status: 402 }
      )
    }
    const url = req.nextUrl.clone()
    url.pathname = "/billing"
    url.searchParams.set("reason", status)
    return NextResponse.redirect(url)
  }

  // Past due — allow through but signal via header (banner shown in UI)
  const res = NextResponse.next()
  if (status === "past_due") {
    res.headers.set("x-subscription-status", "past_due")
  }
  return res
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
