import { NextResponse } from "next/server"

const shopId = "90340196722"
const clientId = "753750a9-7c27-49f6-a227-b11ffdd1c4d9"
const redirectUri = "https://account.clicafe.com/callback?source=core"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")

        // Verificar si hay un error
        if (error) {
            return NextResponse.json({ error: `Error de autenticación: ${error}` }, { status: 400 })
        }

        // Verificar que tenemos un código
        if (!code) {
            return NextResponse.json({ error: "No se recibió código de autorización" }, { status: 400 })
        }

        // Aquí deberíamos verificar el state para prevenir CSRF
        // En una aplicación real, compararíamos con el state guardado en la sesión

        // Obtener el code_verifier de la sesión
        // En una aplicación real, esto vendría de una sesión segura
        const codeVerifier = searchParams.get("code_verifier")

        if (!codeVerifier) {
            return NextResponse.json({ error: "No se encontró code_verifier" }, { status: 400 })
        }

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
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }),
        })

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text()
            console.error("Error al obtener token:", errorText)
            return NextResponse.json(
                { error: `Error al obtener token: ${tokenResponse.status} ${tokenResponse.statusText}` },
                { status: tokenResponse.status },
            )
        }

        const tokenData = await tokenResponse.json()

        return NextResponse.json({
            success: true,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            idToken: tokenData.id_token,
            expiresIn: tokenData.expires_in,
        })
    } catch (error) {
        console.error("Error en el callback de OAuth:", error)
        return NextResponse.json({ error: "Error en el callback de OAuth: " + error.message }, { status: 500 })
    }
}

