import httpStatus from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { adminService } from "./admin.service";
import { sendResponse } from "../../utils/sendResponse";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllUsers({
  search: req.query.search as string,
  page: Number(req.query.page) || 1,
  limit: Number(req.query.limit) || 10,
});

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body;

  const result = await adminService.updateUserStatus(id as string, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User status updated successfully",
    data: result,
  });
});

const getAllGear = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllGear();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear items fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getAllRentalOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllRentalOrders();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental orders fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const adminController = {
  getAllUsers,
  updateUserStatus,
  getAllGear,
  getAllRentalOrders,
};
