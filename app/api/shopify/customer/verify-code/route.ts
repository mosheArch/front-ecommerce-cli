import { NextResponse } from "next/server"

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const endpoint = `https://${domain}/api/2025-01/graphql.json`

// Consulta para verificar un código de un solo uso
const VERIFY_OTP_MUTATION = `
mutation customerRedeemOtp($input: CustomerRedeemOtpInput!) {
  customerRedeemOtp(input: $input) {
    accessToken
    expiresAt
    userErrors {
      field
      message
    }
  }
}
`

export async function POST(request: Request) {
  try {
    const { email, phone, otp } = await request.json()

    if ((!email && !phone) || !otp) {
      return NextResponse.json({ error: "Se requiere email o número de teléfono, y el código OTP" }, { status: 400 })
    }

    const input: any = { otp }
    if (email) input.email = email
    if (phone) input.phone = phone

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken || "",
      },
      body: JSON.stringify({
        query: VERIFY_OTP_MUTATION,
        variables: {
          input,
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

    const { customerRedeemOtp } = data.data

    if (customerRedeemOtp.userErrors.length > 0) {
      const errors = customerRedeemOtp.userErrors
      return NextResponse.json({ error: errors.map((e: any) => e.message).join("\n") }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      accessToken: customerRedeemOtp.accessToken,
      expiresAt: customerRedeemOtp.expiresAt,
    })
  } catch (error) {
    console.error("Error al verificar código:", error)
    return NextResponse.json({ error: "Error al verificar código: " + error.message }, { status: 500 })
  }
}

