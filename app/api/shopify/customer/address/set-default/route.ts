import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para establecer una dirección como predeterminada
const CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION = `
mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
  customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
    customer {
      id
      defaultAddress {
        id
      }
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
        const { token, addressId } = await request.json()

        if (!token || !addressId) {
            return NextResponse.json({ error: "Se requiere token de acceso y ID de dirección" }, { status: 400 })
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
            },
            body: JSON.stringify({
                query: CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
                variables: {
                    customerAccessToken: token,
                    addressId,
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

        const { customerDefaultAddressUpdate } = data.data

        if (customerDefaultAddressUpdate.customerUserErrors && customerDefaultAddressUpdate.customerUserErrors.length > 0) {
            const errors = customerDefaultAddressUpdate.customerUserErrors
            return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            customer: customerDefaultAddressUpdate.customer,
            message: "Dirección predeterminada actualizada correctamente",
        })
    } catch (error) {
        console.error("Error al establecer dirección predeterminada:", error)
        return NextResponse.json(
            { error: "Error al establecer dirección predeterminada: " + error.message },
            { status: 500 },
        )
    }
}
