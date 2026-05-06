import { test, expect, Page } from "@playwright/test"
import { signIn } from "../helpers/auth"

// ---------------------------------------------------------------------------
// Cartões de teste do Asaas Sandbox (não realizam cobranças reais)
// https://asaasv3.docs.apiary.io/#reference/0/tokenizacao-de-cartao-de-credito
// ---------------------------------------------------------------------------
const ASAAS_TEST_CARD = {
  holderName: "FULANO SILVA",
  number: "5162306219378829",
  expiryMonth: "05",
  expiryYear: "2028",
  ccv: "318",
  cpf: "24971563792", // CPF válido para sandbox
  postalCode: "01310-100",
  addressNumber: "100",
}

async function goToBilling(page: Page) {
  // O beforeEach já navegou para /billing — apenas aguarda os planos renderizarem
  await page.waitForSelector("text=Starter", { timeout: 20_000 })
}

async function selectPlan(page: Page, planName: string, cycle: "Mensal" | "Anual" = "Mensal") {
  // Seleciona o ciclo de cobrança
  await page.getByRole("button", { name: cycle }).click()

  // Clica no botão de ação do card do plano desejado ("Fazer upgrade" ou "Fazer downgrade")
  const planCard = page.locator(`text=${planName}`).first().locator("xpath=ancestor::*[contains(@class,'rounded-xl')]").first()
  await planCard.getByRole("button", { name: /fazer upgrade|fazer downgrade/i }).click()
}

async function fillCreditCardForm(page: Page) {
  // Método de pagamento já padrão em "Cartão" — garante seleção
  await page.getByRole("button", { name: /cartão/i }).click()

  // CPF
  await page.getByPlaceholder("000.000.000-00").fill("247.715.637-92")

  // Dados do cartão
  await page.getByPlaceholder("JOAO SILVA").fill(ASAAS_TEST_CARD.holderName)
  await page.getByPlaceholder("0000 0000 0000 0000").fill(
    ASAAS_TEST_CARD.number.replace(/(.{4})/g, "$1 ").trim()
  )
  await page.getByPlaceholder("MM").fill(ASAAS_TEST_CARD.expiryMonth)
  await page.getByPlaceholder("AAAA").fill(ASAAS_TEST_CARD.expiryYear)
  await page.getByPlaceholder("123").fill(ASAAS_TEST_CARD.ccv)

  // Endereço de cobrança
  await page.getByPlaceholder("00000-000").fill(ASAAS_TEST_CARD.postalCode)
  await page.getByPlaceholder("100").fill(ASAAS_TEST_CARD.addressNumber)
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

test.describe("Assinatura de plano", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test("exibe a página de cobrança com os planos disponíveis", async ({ page }) => {
    await goToBilling(page)

    await expect(page.getByText("Starter")).toBeVisible()
    await expect(page.getByText("Pro")).toBeVisible()
    await expect(page.getByText("Business")).toBeVisible()
  })

  test("exibe preços mensais e anuais corretamente", async ({ page }) => {
    await goToBilling(page)

    // Preços mensais
    await page.getByRole("button", { name: "Mensal" }).click()
    await expect(page.getByText("R$ 97")).toBeVisible()
    await expect(page.getByText("R$ 197")).toBeVisible()
    await expect(page.getByText("R$ 397")).toBeVisible()

    // Preços anuais
    await page.getByRole("button", { name: /anual/i }).click()
    await expect(page.getByText("R$ 970")).toBeVisible()
    await expect(page.getByText("R$ 1.970")).toBeVisible()
    await expect(page.getByText("R$ 3.970")).toBeVisible()
  })

  test("abre o formulário de checkout ao selecionar um plano", async ({ page }) => {
    await goToBilling(page)
    await selectPlan(page, "Starter")

    // Formulário deve aparecer com as tabs de método de pagamento
    await expect(page.getByRole("button", { name: /cartão/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /boleto/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /pix/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /confirmar assinatura/i })).toBeVisible()
  })

  test("cancela o checkout e volta para a grade de planos", async ({ page }) => {
    await goToBilling(page)
    await selectPlan(page, "Starter")

    await page.getByRole("button", { name: /cancelar/i }).click()

    // Grade de planos deve reaparecer
    await expect(page.getByText("Starter")).toBeVisible()
    await expect(page.getByText("Pro")).toBeVisible()
  })

  test("exibe campos extras de cartão de crédito ao selecionar esse método", async ({ page }) => {
    await goToBilling(page)
    await selectPlan(page, "Starter")

    await page.getByRole("button", { name: /cartão/i }).click()

    await expect(page.getByPlaceholder("JOAO SILVA")).toBeVisible()
    await expect(page.getByPlaceholder("0000 0000 0000 0000")).toBeVisible()
    await expect(page.getByPlaceholder("MM")).toBeVisible()
    await expect(page.getByPlaceholder("AAAA")).toBeVisible()
    await expect(page.getByPlaceholder("123")).toBeVisible()
    await expect(page.getByPlaceholder("00000-000")).toBeVisible()
  })

  test("exibe mensagem informativa ao selecionar PIX", async ({ page }) => {
    await goToBilling(page)
    await selectPlan(page, "Starter")

    await page.getByRole("button", { name: /pix/i }).click()

    await expect(
      page.getByText(/um qr code pix será gerado/i)
    ).toBeVisible()
    // Campos de cartão NÃO devem aparecer
    await expect(page.getByPlaceholder("0000 0000 0000 0000")).not.toBeVisible()
  })

  test("exibe mensagem informativa ao selecionar Boleto", async ({ page }) => {
    await goToBilling(page)
    await selectPlan(page, "Starter")

    await page.getByRole("button", { name: /boleto/i }).click()

    await expect(
      page.getByText(/um boleto será gerado/i)
    ).toBeVisible()
  })

  test("assina o plano Starter com cartão de crédito (sandbox)", async ({ page }) => {
    await goToBilling(page)
    await selectPlan(page, "Starter")

    await fillCreditCardForm(page)

    // Intercepta a chamada à API para validar o payload enviado
    const [request] = await Promise.all([
      page.waitForRequest((req) => req.url().includes("/api/billing/subscription") && req.method() === "POST"),
      page.getByRole("button", { name: /confirmar assinatura/i }).click(),
    ])

    const body = request.postDataJSON() as {
      planId: string
      billingCycle: string
      billingType: string
      creditCard?: { holderName: string; number: string }
    }

    expect(body.planId).toBe("starter")
    expect(body.billingCycle).toBe("monthly")
    expect(body.billingType).toBe("CREDIT_CARD")
    expect(body.creditCard?.holderName).toBe("FULANO SILVA")
    expect(body.creditCard?.number).toBe(ASAAS_TEST_CARD.number)

    // Após sucesso, o formulário de checkout não deve mais estar visível
    await expect(
      page.getByRole("button", { name: /confirmar assinatura/i })
    ).not.toBeVisible({ timeout: 15_000 })
  })

  test("exibe erro ao submeter cartão com dados inválidos", async ({ page }) => {
    await goToBilling(page)
    await selectPlan(page, "Starter")

    // Preenche CPF e campos obrigatórios com dados inválidos
    await page.getByRole("button", { name: /cartão/i }).click()
    await page.getByPlaceholder("000.000.000-00").fill("111.111.111-11")
    await page.getByPlaceholder("JOAO SILVA").fill("TESTE INVALIDO")
    await page.getByPlaceholder("0000 0000 0000 0000").fill("1234 5678 9012 3456")
    await page.getByPlaceholder("MM").fill("01")
    await page.getByPlaceholder("AAAA").fill("2020") // cartão expirado
    await page.getByPlaceholder("123").fill("000")
    await page.getByPlaceholder("00000-000").fill("00000-000")
    await page.getByPlaceholder("100").fill("1")

    await page.getByRole("button", { name: /confirmar assinatura/i }).click()

    // Deve aparecer uma mensagem de erro (qualquer texto de erro retornado pela API)
    await expect(
      page.locator("p.text-red-400").first()
    ).toBeVisible({ timeout: 15_000 })
  })
})
