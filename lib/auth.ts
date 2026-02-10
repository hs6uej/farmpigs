/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activity-logger';

// Note: Login locking logic is handled by /api/auth/check-credentials
// This authorize function only validates credentials for NextAuth session

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        // Check if account is locked (in case someone bypasses check-credentials)
        if (user.lockedAt) {
          if (!user.lockedUntil || new Date() <= user.lockedUntil) {
            throw new Error('Account locked');
          }
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        // Login successful - reset failed attempts (if any)
        if (user.failedLoginAttempts > 0 || user.lockedAt) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedAt: null,
              lockedUntil: null,
              lockedReason: null,
            }
          });
        }

        return user;
      }
    })
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async signIn({ user }: any) {
      // Log successful login
      if (user?.id) {
        await logActivity({
          userId: user.id,
          userEmail: user.email || '',
          userName: user.name,
          action: 'LOGIN',
          module: 'AUTH',
          details: { provider: 'credentials' },
        });
      }
      return true;
    }
  },
  events: {
    async signOut({ token }: any) {
      // Log logout
      if (token?.sub) {
        await logActivity({
          userId: token.sub,
          userEmail: token.email || '',
          userName: token.name,
          action: 'LOGOUT',
          module: 'AUTH',
        });
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};
