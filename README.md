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
- `push` na `main`: também gera e publica a imagem Docker no Artifact Registry

Imagem publicada:

```text
us-east1-docker.pkg.dev/semanticzap/semanticzap-admin/semanticzap-admin
```

Autenticação com GCP:

- Workload Identity Provider: `projects/513791847416/locations/global/workloadIdentityPools/github-actions/providers/github-admin-oidc`
- Service account: `gha-semanticzap-admin@semanticzap.iam.gserviceaccount.com`
