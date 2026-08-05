"use client";

import {
  createContext,
  useContext,
} from "react";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  getMe,
} from "@/lib/api/auth/me";


type AuthContextType = {
  user: any;
  organizationId: string | null;
  isLoading: boolean;
};


const AuthContext =
  createContext<AuthContextType>({
    user: null,
    organizationId: null,
    isLoading: true,
  });


export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const {
  data: user,
  isLoading,
  error,
} = useQuery({
  queryKey: ["me"],
  queryFn: getMe,
  staleTime: 1000 * 60 * 10,
  refetchOnWindowFocus: false,
});


console.log(
  "AUTH USER RESPONSE",
  JSON.stringify(user, null, 2)
);


 const organizationId =
  user?.memberships?.[0]?.organization?.id ??
  user?.memberships?.[0]?.organizationId ??
  null;


  return (
    <AuthContext.Provider
      value={{
        user,
        organizationId,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}