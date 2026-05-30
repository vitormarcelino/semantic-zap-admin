# semanticzap-admin

## Desenvolvimento

```bash
npm run dev
```

Para ambiente completo com Postgres via Docker:

```bash
npm run dev:docker
```

## CI/CD

O repositório usa GitHub Actions em `.github/workflows/ci-cd.yml`.

- `pull_request` e `push`: executam `npm ci`, `npx prisma generate`, `npm run lint` e `npm run build`
- `push` na `main`: também gera a imagem Docker, publica no Artifact Registry e faz o deploy blue/green na VM

Imagem publicada:

```text
us-east1-docker.pkg.dev/semanticzap/semanticzap-admin/semanticzap-admin
```

Autenticação com GCP:

- Workload Identity Provider: `projects/513791847416/locations/global/workloadIdentityPools/github-actions/providers/github-admin-oidc`
- Service account: `gha-semanticzap-admin@semanticzap.iam.gserviceaccount.com`

Deploy na VM:

- porta pública do admin no host: `3000`
- stack compartilhada em `/opt/semanticzap/shared` com Postgres, Redis e Nginx
- cores blue/green do admin escutam internamente em `3001` e `3002`

Secrets necessários no GitHub:

- `VM_HOST`
- `VM_USER`
- `VM_SSH_PRIVATE_KEY`
- `VM_PORT` (opcional; padrão `22`)
