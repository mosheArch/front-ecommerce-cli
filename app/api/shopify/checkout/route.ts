import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para crear un carrito
const CART_CREATE_MUTATION = `
mutation cartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      id
      checkoutUrl
      totalQuantity
      cost {
        totalAmount {
          amount
          currencyCode
        }
      }
      lines(first: 10) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  title
                }
              }
            }
          }
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
`

export async function POST(request: Request) {
  try {
    const { items, customerAccessToken } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Se requieren items para el checkout" }, { status: 400 })
    }

    // Preparar los items para el carrito
    const lines = items.map((item) => ({
      quantity: item.quantity,
      merchandiseId: item.variantId,
    }))

    // Construir la consulta GraphQL
    const variables = {
      input: {
        lines,
        buyerIdentity: customerAccessToken
            ? {
              customerAccessToken: customerAccessToken,
            }
            : undefined,
      },
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
      },
      body: JSON.stringify({
        query: CART_CREATE_MUTATION,
        variables,
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

    const { cartCreate } = data.data

    if (cartCreate.userErrors && cartCreate.userErrors.length > 0) {
      const errors = cartCreate.userErrors
      return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
    }

    // Devolver la URL de checkout y la información del carrito
    return NextResponse.json({
      success: true,
      checkout: {
        id: cartCreate.cart.id,
        webUrl: cartCreate.cart.checkoutUrl,
        totalPrice: {
          amount: cartCreate.cart.cost.totalAmount.amount,
          currencyCode: cartCreate.cart.cost.totalAmount.currencyCode,
        },
      },
    })
  } catch (error) {
    console.error("Error al crear checkout:", error)
    return NextResponse.json({ error: "Error al crear checkout: " + error.message }, { status: 500 })
  }
}

