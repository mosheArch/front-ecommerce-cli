import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para actualizar una dirección
const CUSTOMER_ADDRESS_UPDATE_MUTATION = `
mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
  customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
    customerAddress {
      id
      address1
      address2
      city
      province
      country
      zip
      phone
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
        const { token, addressId, address } = await request.json()

        if (!token || !addressId || !address) {
            return NextResponse.json(
                { error: "Se requiere token de acceso, ID de dirección y datos de dirección" },
                { status: 400 },
            )
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
            },
            body: JSON.stringify({
                query: CUSTOMER_ADDRESS_UPDATE_MUTATION,
                variables: {
                    customerAccessToken: token,
                    id: addressId,
                    address: {
                        address1: address.address1,
                        address2: address.address2 || "",
                        city: address.city,
                        province: address.province,
                        country: address.country,
                        zip: address.zip,
                        phone: address.phone || "",
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

        const { customerAddressUpdate } = data.data

        if (customerAddressUpdate.customerUserErrors && customerAddressUpdate.customerUserErrors.length > 0) {
            const errors = customerAddressUpdate.customerUserErrors
            return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            address: customerAddressUpdate.customerAddress,
            message: "Dirección actualizada correctamente",
        })
    } catch (error) {
        console.error("Error al actualizar dirección:", error)
        return NextResponse.json({ error: "Error al actualizar dirección: " + error.message }, { status: 500 })
    }
}

