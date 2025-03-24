import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para obtener productos
const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
                availableForSale
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
    // Obtener el parámetro limit de la URL
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Hacer la solicitud a la API de Shopify
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
      },
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: { first: limit },
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

    // Transformar los datos para que sean más fáciles de usar
    const products = data.data.products.edges.map((edge: any) => {
      const product = edge.node
      const image = product.images.edges[0]?.node || null
      const variant = product.variants.edges[0]?.node || null

      return {
        id: product.id.split("/").pop(),
        title: product.title,
        handle: product.handle,
        description: product.description,
        price: product.priceRange.minVariantPrice.amount,
        currency: product.priceRange.minVariantPrice.currencyCode,
        imageUrl: image?.url || null,
        imageAlt: image?.altText || product.title,
        variantId: variant?.id || null,
        available: variant?.availableForSale || false,
      }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Error al obtener productos: " + error.message }, { status: 500 })
  }
}

