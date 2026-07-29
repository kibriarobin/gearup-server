import { UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateUserStatusPayload {
  status: UserStatus;
}

export interface GetAllUsersParams {
  search?: string;
  page?: number;
  limit?: number;
}