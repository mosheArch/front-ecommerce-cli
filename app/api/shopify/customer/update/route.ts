import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para actualizar el perfil del cliente
const CUSTOMER_UPDATE_MUTATION = `
mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
  customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
    customer {
      id
      firstName
      lastName
      email
      phone
    }
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
    const { token, firstName, lastName, email, phone } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Se requiere token de acceso" }, { status: 400 })
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
      },
      body: JSON.stringify({
        query: CUSTOMER_UPDATE_MUTATION,
        variables: {
          customerAccessToken: token,
          customer: {
            firstName,
            lastName,
            email,
            phone,
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

    const { customerUpdate } = data.data

    if (customerUpdate.customerUserErrors && customerUpdate.customerUserErrors.length > 0) {
      const errors = customerUpdate.customerUserErrors
      return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      customer: customerUpdate.customer,
      message: "Perfil actualizado correctamente",
    })
  } catch (error) {
    console.error("Error al actualizar perfil:", error)
    return NextResponse.json({ error: "Error al actualizar perfil: " + error.message }, { status: 500 })
  }
}

