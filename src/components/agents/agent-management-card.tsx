"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bot, Pencil, Trash2 } from "lucide-react"
import { deleteAgent } from "@/app/agents/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const LANGUAGE_LABELS: Record<string, string> = {
  "pt-BR": "PT-BR",
  en: "EN",
}

type Agent = {
  id: string
  name: string
  description: string | null
  language: string
  tone: string
  model: string
  temperature: number
  maxTokens: number
}

interface AgentManagementCardProps {
  agent: Agent
}

export function AgentManagementCard({ agent }: AgentManagementCardProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteAgent(agent.id)
      router.refresh()
      setConfirmOpen(false)
    })
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
              <Bot
                size={18}
                className="text-accent-foreground"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {agent.name}
              </p>
              {agent.description ? (
                <p className="truncate text-xs text-muted-foreground">
                  {agent.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic">Sem descrição</p>
              )}
            </div>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">
            {LANGUAGE_LABELS[agent.language] ?? agent.language}
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4">
          <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {agent.model}
          </span>
          <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {agent.tone}
          </span>
          <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            temp {agent.temperature.toFixed(2)}
          </span>
          <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {agent.maxTokens} tok
          </span>
        </div>

        <div className="mx-5 h-px bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 py-3">
          <Link
            href={`/agents/${agent.id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
          >
            <Pencil size={12} strokeWidth={1.5} strokeLinecap="round" />
            Editar
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive/70 transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 size={12} strokeWidth={1.5} strokeLinecap="round" />
            Excluir
          </button>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir agente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong className="text-foreground">{agent.name}</strong>? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {isPending ? "Excluindo..." : "Excluir"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
