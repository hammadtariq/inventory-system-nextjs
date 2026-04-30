import { get, post } from "@/lib/http-client";

export const registerOrganization = (data) => post("/api/org/register", data);

export const inviteOrganizationUser = (data) => post("/api/org/invite", data);

export const acceptOrganizationInvite = (data) => post("/api/org/accept-invite", data);

export const getOrganizationUsers = () => get("/api/user");
