import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

// 本地应用：默认已登录，直接返回 children
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
