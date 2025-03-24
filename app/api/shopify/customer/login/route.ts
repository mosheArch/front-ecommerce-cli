import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para iniciar sesión de cliente
const CUSTOMER_LOGIN_MUTATION = `
mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
  customerAccessTokenCreate(input: $input) {
    customerAccessToken {
      accessToken
      expiresAt
    }
    customerUserErrors {
      code
      field
      message
    }
  }
}
`

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Se requieren email y password" }, { status: 400 })
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
      },
      body: JSON.stringify({
        query: CUSTOMER_LOGIN_MUTATION,
        variables: {
          input: {
            email,
            password,
          },
        },
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
          { error: `Error de API: ${response.status} ${response.statusText}` },
          { status: response.status },
      )
    }

    const data = await response.json()

    if (data.errors) {
      return NextResponse.json({ error: data.errors.map((e: any) => e.message).join("\n") }, { status: 400 })
    }

    const { customerAccessTokenCreate } = data.data

    if (customerAccessTokenCreate.customerUserErrors && customerAccessTokenCreate.customerUserErrors.length > 0) {
      const errors = customerAccessTokenCreate.customerUserErrors
      return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
    }

    // Incluir la URL de la cuenta en la respuesta
    return NextResponse.json({
      success: true,
      customerAccessToken: customerAccessTokenCreate.customerAccessToken,
    })
  } catch (error) {
    console.error("Error en login de cliente:", error)
    return NextResponse.json({ error: "Error al iniciar sesión: " + error.message }, { status: 500 })
  }
}

