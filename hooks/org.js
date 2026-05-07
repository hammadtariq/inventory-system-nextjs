import { get, post } from "@/lib/http-client";
import { put, remove } from "@/lib/http-client";

export const registerOrganization = (data) => post("/api/org/register", data);

export const inviteOrganizationUser = (data) => post("/api/org/invite", data);

export const resendOrganizationInvite = (id, sendEmail = true) => post(`/api/org/invite/${id}`, { sendEmail });

export const acceptOrganizationInvite = (data) => post("/api/org/accept-invite", data);

export const getOrganizationUsers = () => get("/api/user");

export const getOrganizationUser = (id) => get(`/api/user/${id}`);

export const updateOrganizationUser = (id, data) => put(`/api/user/${id}`, data);

export const deleteOrganizationUser = (id) => remove(`/api/user/${id}`);

export const getOrganizations = (params = {}) => get("/api/organizations", { params });

export const getOrganization = (id) => get(`/api/organizations/${id}`);

export const updateOrganization = (id, data) => put(`/api/organizations/${id}`, data);

export const deleteOrganization = (id) => remove(`/api/organizations/${id}`);
