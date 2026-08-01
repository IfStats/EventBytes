"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { login } from "@/lib/api/auth/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      const result = await login({
        email,
        password,
      });

      localStorage.setItem(
        "accessToken",
        result.accessToken,
      );

      localStorage.setItem(
        "refreshToken",
        result.refreshToken,
      );

      router.push("/dashboard");
    } catch (err) {
      alert("Invalid email or password.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center">

      <Card className="w-[420px]">

        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            className="w-full"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

        </CardContent>

      </Card>

    </main>
  );
}