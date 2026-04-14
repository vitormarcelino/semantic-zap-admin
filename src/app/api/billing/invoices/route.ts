import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 10
  const offset = (page - 1) * limit

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.invoice.count({ where: { userId } }),
  ])

  return NextResponse.json({
    invoices,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
