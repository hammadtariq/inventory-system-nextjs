import { get, post } from "@/lib/http-client";

export const loginUser = (data) => post("/api/user/login", data);

export const verifyToken = () => get("/api/user/verify-token");
