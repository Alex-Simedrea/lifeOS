import ConvexClientProvider from "@/providers/convex-client-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
