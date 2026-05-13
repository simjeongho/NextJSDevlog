// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/write", "/dashboard/:path*"], // ⭐ 보호할 경로
};
