import { NextResponse } from "next/server"

const shopId = "90340196722"
const clientId = "753750a9-7c27-49f6-a227-b11ffdd1c4d9"
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || ""

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const redirectUri = "https://account.clicafe.com/callback?source=core"

        if (!code) {
            return NextResponse.json({ error: "No se recibió código de autorización" }, { status: 400 })
        }

        console.log("Intercambiando código por token:", code)
        console.log("Redirect URI:", redirectUri)

        // Intercambiar el código por un token de acceso
        const tokenResponse = await fetch(`https://shopify.com/authentication/${shopId}/oauth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "ClicafeApp/1.0",
                Origin: "https://account.clicafe.com",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            }),
        })

        const responseText = await tokenResponse.text()
        console.log("Respuesta completa:", responseText)

        if (!tokenResponse.ok) {
            console.error("Error al obtener token:", responseText)
            return NextResponse.json(
                { error: `Error al obtener token: ${tokenResponse.status} ${tokenResponse.statusText}` },
                { status: tokenResponse.status },
            )
        }

        let tokenData
        try {
            tokenData = JSON.parse(responseText)
        } catch (e) {
            console.error("Error al parsear respuesta:", e)
            return NextResponse.json({ error: "Error al parsear respuesta del servidor" }, { status: 500 })
        }

        // Calcular la fecha de expiración
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

        return NextResponse.json({
            success: true,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            idToken: tokenData.id_token,
            expiresAt: expiresAt.toISOString(),
        })
    } catch (error) {
        console.error("Error al obtener token:", error)
        return NextResponse.json({ error: "Error al obtener token: " + error.message }, { status: 500 })
    }
}

