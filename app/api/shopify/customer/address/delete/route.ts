import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para eliminar una dirección
const CUSTOMER_ADDRESS_DELETE_MUTATION = `
mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
  customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
    deletedCustomerAddressId
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
                query: CUSTOMER_ADDRESS_DELETE_MUTATION,
                variables: {
                    customerAccessToken: token,
                    id: addressId,
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

        const { customerAddressDelete } = data.data

        if (customerAddressDelete.customerUserErrors && customerAddressDelete.customerUserErrors.length > 0) {
            const errors = customerAddressDelete.customerUserErrors
            return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            deletedAddressId: customerAddressDelete.deletedCustomerAddressId,
            message: "Dirección eliminada correctamente",
        })
    } catch (error) {
        console.error("Error al eliminar dirección:", error)
        return NextResponse.json({ error: "Error al eliminar dirección: " + error.message }, { status: 500 })
    }
}

