import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para obtener las órdenes del cliente
const CUSTOMER_ORDERS_QUERY = `
query getCustomerOrders($customerAccessToken: String!, $first: Int!) {
  customer(customerAccessToken: $customerAccessToken) {
    orders(first: $first) {
      edges {
        node {
          id
          orderNumber
          processedAt
          financialStatus
          fulfillmentStatus
          currentTotalPrice {
            amount
            currencyCode
          }
          lineItems(first: 10) {
            edges {
              node {
                title
                quantity
                originalTotalPrice {
                  amount
                  currencyCode
                }
                variant {
                  title
                  image {
                    url
                  }
                  product {
                    title
                  }
                }
              }
            }
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
    const limit = Number.parseInt(searchParams.get("limit") || "10")

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
        query: CUSTOMER_ORDERS_QUERY,
        variables: {
          customerAccessToken,
          first: limit,
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
      orders: data.data.customer.orders.edges.map((edge: any) => edge.node),
    })
  } catch (error) {
    console.error("Error al obtener órdenes del cliente:", error)
    return NextResponse.json({ error: "Error al obtener órdenes: " + error.message }, { status: 500 })
  }
}

