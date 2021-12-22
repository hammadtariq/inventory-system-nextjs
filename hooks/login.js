import useSWR from "swr";

import { get, post, put, remove } from "@/lib/http-client";
import { cache } from "joi";

import router from "next/router";

// const router = useRouter();

export const loginUser = (data) => post("/api/user/login", data);

export const verifyToken = () => get("/api/user/verify-token");
