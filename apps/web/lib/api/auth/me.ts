import { api } from "../client";


export async function getMe() {
  const response =
    await api.get("/auth/me");

  return response.data;
}