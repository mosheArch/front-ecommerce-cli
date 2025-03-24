import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para revocar el token de acceso del cliente
const CUSTOMER_LOGOUT_MUTATION = `
mutation customerAccessTokenDelete($customerAccessToken: String!) {
  customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
    deletedAccessToken
    deletedCustomerAccessTokenId
    userErrors {
      field
      message
    }
  }
}
`

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

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
        query: CUSTOMER_LOGOUT_MUTATION,
        variables: {
          customerAccessToken: token,
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

    const { customerAccessTokenDelete } = data.data

    if (customerAccessTokenDelete.userErrors && customerAccessTokenDelete.userErrors.length > 0) {
      const errors = customerAccessTokenDelete.userErrors
      return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Sesión cerrada correctamente",
    })
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    return NextResponse.json({ error: "Error al cerrar sesión: " + error.message }, { status: 500 })
  }
}

