import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para solicitar recuperación de contraseña
const CUSTOMER_RECOVER_MUTATION = `
mutation customerRecover($email: String!) {
  customerRecover(email: $email) {
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
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Se requiere email" }, { status: 400 })
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
      },
      body: JSON.stringify({
        query: CUSTOMER_RECOVER_MUTATION,
        variables: {
          email,
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

    const { customerRecover } = data.data

    if (customerRecover.customerUserErrors && customerRecover.customerUserErrors.length > 0) {
      const errors = customerRecover.customerUserErrors
      return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.",
    })
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error)
    return NextResponse.json(
        { error: "Error al solicitar recuperación de contraseña: " + error.message },
        { status: 500 },
    )
  }
}

