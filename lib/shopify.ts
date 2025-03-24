// Configuración básica para la API de Shopify
const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const apiVersion = "2025-01"
const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`

// Función para realizar consultas GraphQL a la API de Shopify
async function shopifyFetch({ query, variables = {} }) {
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
            },
            body: JSON.stringify({ query, variables }),
        })

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`)
        }

        const json = await response.json()

        if (json.errors) {
            throw new Error(json.errors.map((e) => e.message).join("\n"))
        }

        return json.data
    } catch (error) {
        console.error("Error fetching from Shopify:", error)
        throw error
    }
}

// Consulta para obtener productos
export async function getProducts(first = 20) {
    if (first > 250) first = 250 // Límite de Shopify

    const query = `
    {
      products(first: ${first}) {
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

    const data = await shopifyFetch({ query })

    return data.products.edges.map((edge) => {
        const product = edge.node
        const image = product.images.edges[0]?.node || null
        const variant = product.variants.edges[0]?.node || null

        // Guardar el ID completo sin modificar
        return {
            id: product.id,
            gid: product.id, // ID completo con el formato gid://shopify/Product/XXXXX
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
}

// Modificar la función getProductById para aceptar el ID completo
export async function getProductById(id) {
    console.log("Getting product with ID:", id)

    // Validar que el ID no sea undefined, null, o true
    if (!id || id === true) {
        throw new Error("ID de producto inválido")
    }

    const query = `
    {
      product(id: "${id}") {
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
              price {
                amount
                currencyCode
              }
              availableForSale
            }
          }
        }
      }
    }
  `

    try {
        const data = await shopifyFetch({ query })

        if (!data.product) return null

        const product = data.product
        const images = product.images.edges.map((edge) => edge.node)
        const variants = product.variants.edges.map((edge) => edge.node)

        return {
            id: product.id,
            title: product.title,
            handle: product.handle,
            description: product.description,
            descriptionHtml: product.descriptionHtml,
            price: product.priceRange.minVariantPrice.amount,
            currency: product.priceRange.minVariantPrice.currencyCode,
            images,
            variants,
            available: variants.some((v) => v.availableForSale),
        }
    } catch (error) {
        console.error("Error fetching product by ID:", error)
        throw error
    }
}

