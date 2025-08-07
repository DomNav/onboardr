import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Stellar Wallet',
      credentials: {
        address: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.address) {
          return null;
        }

        const address = credentials.address;
        
        // Check if address looks like a valid Stellar address
        if (!address.match(/^G[A-Z0-9]{55}$/)) {
          throw new Error('Invalid Stellar address format');
        }

        // Simple user object without crypto hashing
        const displayName = `${address.slice(0, 4)}...${address.slice(-4)}`;

        return {
          id: address, // Use address as ID directly
          name: displayName,
          email: address, // Using address as email for NextAuth compatibility
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.address = user.email || ''; // email contains the wallet address
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.address = token.address as string;
        session.user.id = token.userId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };