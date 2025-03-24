import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para obtener información del cliente
const CUSTOMER_QUERY = `
query getCustomerInfo($customerAccessToken: String!) {
  customer(customerAccessToken: $customerAccessToken) {
    id
    firstName
    lastName
    email
    phone
    defaultAddress {
      id
      address1
      address2
      city
      province
      country
      zip
      phone
    }
    addresses(first: 5) {
      edges {
        node {
          id
          address1
          address2
          city
          province
          country
          zip
          phone
        }
      }
    }
    orders(first: 5) {
      edges {
        node {
          id
          orderNumber
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
}
`

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerAccessToken = searchParams.get("token")

    if (!customerAccessToken) {
      return NextResponse.json({ error: "Se requiere token de acceso" }, { status: 400 })
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
      },
      body: JSON.stringify({
        query: CUSTOMER_QUERY,
        variables: {
          customerAccessToken,
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

    if (!data.data.customer) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      customer: data.data.customer,
    })
  } catch (error) {
    console.error("Error al obtener información del cliente:", error)
    return NextResponse.json({ error: "Error al obtener información del cliente: " + error.message }, { status: 500 })
  }
}

