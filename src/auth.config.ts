import type { NextAuthConfig } from "next-auth";

// Edge-compatible subset of the auth config: no Credentials provider here
// (its authorize() pulls in Prisma, which needs the Node runtime), so this
// is the only part safe to load from middleware.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isAuthed = !!auth?.user;
      const isAuthRoute =
        request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/signup";

      if (!isAuthed && !isAuthRoute) return false;
      if (isAuthed && isAuthRoute) {
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
  },
};
