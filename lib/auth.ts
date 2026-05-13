// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ⭐ 데모용 사용자 (실무에선 DB 의 users 테이블 + bcrypt 비교)
const DEMO_USERS = [
  { id: "1", username: "심정호", password: "심정호123", name: "심정호" },
  { id: "2", username: "bob", password: "bob123", name: "밥" },
  { id: "3", username: "kim", password: "kim123", name: "김개발" },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = DEMO_USERS.find(
          (u) => u.username === credentials.username && u.password === credentials.password,
        );

        if (!user) return null;
        return { id: user.id, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login", // ⭐ 커스텀 로그인 페이지
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};
