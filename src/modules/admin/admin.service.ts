import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { GetAllUsersParams, IUpdateUserStatusPayload } from "./admin.interface";

const getAllUsers = async ({ search, page = 1, limit = 10 }: GetAllUsersParams) => {
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const skip = (page - 1) * limit;

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      omit: {
        password: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: {
      total: totalUsers,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
    },
  };
};

const updateUserStatus = async (
  userId: string,
  payload: IUpdateUserStatusPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: payload.status,
    },
    omit: {
      password: true,
    },
  });

  return updatedUser;
};

const getAllGear = async () => {
  const gears = await prisma.gearItem.findMany({
    include: {
      category: true,
      provider: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalGear = await prisma.gearItem.count();

  return {
    data: gears,
    meta: {
      total: totalGear,
    },
  };
};

const getAllRentalOrders = async () => {
  const orders = await prisma.rentalOrder.findMany({
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      gear: {
        select: {
          id: true,
          name: true,
          pricePerDay: true,
          provider: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOrders = await prisma.rentalOrder.count();

  return {
    data: orders,
    meta: {
      total: totalOrders,
    },
  };
};

export const adminService = {
  getAllUsers,
  updateUserStatus,
  getAllGear,
  getAllRentalOrders,
};
