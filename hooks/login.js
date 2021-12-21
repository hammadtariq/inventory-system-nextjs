import { get, post, put, remove } from "@/lib/http-client";

export const loginUser = (data) => post("/api/user/login", data);
