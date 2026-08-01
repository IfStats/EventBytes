"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  useState,
} from "react";

import {
  AuthProvider,
} from "@/context/auth-context";


export function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  );


  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}