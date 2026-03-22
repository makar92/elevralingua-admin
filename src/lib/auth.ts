// ===========================================
// Файл: src/lib/auth.ts
// Описание:
//   NextAuth v5 — два провайдера:
//   1. Credentials — email+пароль для ВСЕХ ролей (admin, teacher, student)
//   2. Google OAuth — опциональный, для регистрации новых учителей/учеников
// ===========================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Google OAuth — подключаем только если ключи настроены
const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
const hasGoogle = googleId && googleSecret && googleId !== "your-google-client-id";

const providers: any[] = [
  // Email + пароль — для всех ролей
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });
      if (!user || !user.passwordHash) return null;

      const isValid = await compare(credentials.password as string, user.passwordHash);
      if (!isValid) return null;

      return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image };
    },
  }),
];

// Добавляем Google только если ключи настроены
if (hasGoogle) {
  providers.push(
    Google({
      clientId: googleId!,
      clientSecret: googleSecret!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,

  callbacks: {
    async signIn({ user, account }) {
      // Для Google: проверяем/создаём пользователя
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        let dbUser = await prisma.user.findUnique({ where: { email } });

        if (!dbUser) {
          // Новый пользователь через Google — создаём как STUDENT (роль выберет при онбординге)
          dbUser = await prisma.user.create({
            data: {
              email,
              name: user.name || email.split("@")[0],
              image: user.image,
              role: "STUDENT",
            },
          });
        } else {
          // Обновляем картинку если изменилась
          if (user.image && user.image !== dbUser.image) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: user.image },
            });
          }
        }

        // Связываем Google аккаунт если ещё не связан
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // При первом логине — берём данные из БД
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.image = dbUser.image;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.image as string | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
