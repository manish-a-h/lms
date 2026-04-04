import { Role, LeaveStatus, User } from "../generated/prisma/client";

export { Role, LeaveStatus };

export type UserProfile = Pick<User, "id" | "email" | "name" | "role"> & {
  department?: string;
  designation?: string;
};
