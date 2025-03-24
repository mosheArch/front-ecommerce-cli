import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para registrar un nuevo cliente
const CUSTOMER_CREATE_MUTATION = `
mutation customerCreate($input: CustomerCreateInput!) {
  customerCreate(input: $input) {
    customer {
      id
      email
      firstName
      lastName
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
    const { email, password, firstName, lastName, acceptsMarketing } = await request.json()

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
        query: CUSTOMER_CREATE_MUTATION,
        variables: {
          input: {
            email,
            password,
            firstName: firstName || "",
            lastName: lastName || "",
            acceptsMarketing: acceptsMarketing || false,
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

    const { customerCreate } = data.data

    if (customerCreate.customerUserErrors && customerCreate.customerUserErrors.length > 0) {
      const errors = customerCreate.customerUserErrors
      return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
    }

    // Incluir la URL de la cuenta en la respuesta
    return NextResponse.json({
      success: true,
      customer: customerCreate.customer,
      message: "Registro exitoso. Ahora puedes iniciar sesión.",
    })
  } catch (error) {
    console.error("Error en registro de cliente:", error)
    return NextResponse.json({ error: "Error al registrar cliente: " + error.message }, { status: 500 })
  }
}

