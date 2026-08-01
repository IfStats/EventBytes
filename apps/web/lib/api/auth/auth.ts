import { api } from "../client";

export type LoginDto = {
  email: string;
  password: string;
};

export async function login(data: LoginDto) {
  const response = await api.post("/auth/login", data);

  return response.data;
}