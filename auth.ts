import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });
    const refreshed = await response.json();
    if (!response.ok) throw refreshed;
    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in as number),
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("[auth] Erro ao renovar token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/business.manage",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }
      // Token ainda válido
      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }
      // Token expirado — renova automaticamente
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      if (token.error) session.error = token.error as string;
      return session;
    },
  },
});
