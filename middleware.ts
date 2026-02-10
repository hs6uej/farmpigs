import { withAuth } from "next-auth/middleware"

export default withAuth({
    pages: {
        signIn: "/auth/signin",
    },
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - auth (Auth pages like /auth/signin, /auth/register)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, svg, etc. if any in root)
         */
        "/((?!api|auth|_next/static|_next/image|favicon.ico).*)",
    ],
}
