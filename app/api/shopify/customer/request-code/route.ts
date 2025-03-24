import { NextResponse } from "next/server"
import crypto from "crypto"

// Configuración de Shopify Customer Accounts
const shopId = "90340196722"
const clientId = "753750a9-7c27-49f6-a227-b11ffdd1c4d9"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Se requiere email" }, { status: 400 })
    }

    // Generar un nonce para seguridad
    const nonce = crypto.randomUUID()

    // Usar la URL de callback registrada en Shopify
    const redirectUri = "https://account.clicafe.com/callback?source=core"

    // Construir la URL de autorización
    const authUrl = new URL(`https://shopify.com/authentication/${shopId}/oauth/authorize`)
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("locale", "es")
    authUrl.searchParams.append("nonce", nonce)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", "openid email customer-account-api:full")
    authUrl.searchParams.append("state", crypto.randomUUID())

    // Construir la URL de login con código
    const loginUrl = new URL(`https://shopify.com/authentication/${shopId}/login`)
    loginUrl.searchParams.append("client_id", clientId)
    loginUrl.searchParams.append("locale", "es")
    loginUrl.searchParams.append("redirect_uri", authUrl.toString())

    console.log("URL de login generada:", loginUrl.toString())

    return NextResponse.json({
      success: true,
      loginUrl: loginUrl.toString(),
    })
  } catch (error) {
    console.error("Error al generar URL de login:", error)
    return NextResponse.json({ error: "Error al generar URL de login: " + error.message }, { status: 500 })
  }
}

