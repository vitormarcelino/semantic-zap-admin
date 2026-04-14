import { NextResponse } from "next/server"
import { getPaidPlans } from "@/lib/billing/plans"

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ plans: getPaidPlans() })
}
