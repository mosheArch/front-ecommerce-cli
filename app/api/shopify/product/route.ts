import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para obtener detalles de un producto específico
const PRODUCT_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 5) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            availableForSale
            price {
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
    // Obtener el parámetro handle de la URL
    const { searchParams } = new URL(request.url)
    const handle = searchParams.get("handle")

    if (!handle) {
      return NextResponse.json({ error: "Se requiere el parámetro handle" }, { status: 400 })
    }

    // Hacer la solicitud a la API de Shopify
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
      },
      body: JSON.stringify({
        query: PRODUCT_QUERY,
        variables: { handle },
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

    if (!data.data.product) {
      return NextResponse.json({ error: `Producto con handle "${handle}" no encontrado` }, { status: 404 })
    }

    // Transformar los datos para que sean más fáciles de usar
    const product = data.data.product
    const images = product.images.edges.map((edge: any) => edge.node)
    const variants = product.variants.edges.map((edge: any) => edge.node)

    const formattedProduct = {
      id: product.id.split("/").pop(),
      title: product.title,
      handle: product.handle,
      description: product.description,
      descriptionHtml: product.descriptionHtml,
      price: product.priceRange.minVariantPrice.amount,
      currency: product.priceRange.minVariantPrice.currencyCode,
      images,
      variants,
      available: variants.some((v: any) => v.availableForSale),
    }

    return NextResponse.json({ product: formattedProduct })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Error al obtener detalles del producto: " + error.message }, { status: 500 })
  }
}

