// middleware.ts
import { default as middleware } from "next-auth/middleware";

export default middleware;

export const config = {
  matcher: ["/write", "/dashboard/:path*"], // ⭐ 보호할 경로
};
