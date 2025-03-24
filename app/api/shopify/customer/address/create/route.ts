import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para crear una dirección
const CUSTOMER_ADDRESS_CREATE_MUTATION = `
mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
  customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
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
        const { token, address } = await request.json()

        if (!token || !address) {
            return NextResponse.json({ error: "Se requiere token de acceso y datos de dirección" }, { status: 400 })
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
            },
            body: JSON.stringify({
                query: CUSTOMER_ADDRESS_CREATE_MUTATION,
                variables: {
                    customerAccessToken: token,
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

        const { customerAddressCreate } = data.data

        if (customerAddressCreate.customerUserErrors && customerAddressCreate.customerUserErrors.length > 0) {
            const errors = customerAddressCreate.customerUserErrors
            return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            address: customerAddressCreate.customerAddress,
            message: "Dirección creada correctamente",
        })
    } catch (error) {
        console.error("Error al crear dirección:", error)
        return NextResponse.json({ error: "Error al crear dirección: " + error.message }, { status: 500 })
    }
}

