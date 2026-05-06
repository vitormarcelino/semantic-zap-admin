import { Page } from "@playwright/test"

/**
 * Faz login via formulário da página /sign-in usando as credenciais de teste.
 * Requer as variáveis de ambiente:
 *   E2E_TEST_EMAIL    — e-mail do usuário de teste
 *   E2E_TEST_PASSWORD — senha do usuário de teste
 */
export async function signIn(page: Page) {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD

  if (!email || !password) {
    throw new Error(
      "Defina E2E_TEST_EMAIL e E2E_TEST_PASSWORD para rodar os testes E2E."
    )
  }

  // Navega para /billing — se já houver sessão ativa, carrega direto;
  // se não, o middleware redireciona para /sign-in
  await page.goto("/billing")

  // Se foi redirecionado para sign-in, faz o login
  if (page.url().includes("/sign-in")) {
    await page.locator("#email").fill(email)
    await page.locator("#password").fill(password)
    await page.getByRole("button", { name: /sign in/i }).click()
  }

  // Aguarda carregar a página de billing
  await page.waitForURL(/\/billing/, { timeout: 30_000 })
}
