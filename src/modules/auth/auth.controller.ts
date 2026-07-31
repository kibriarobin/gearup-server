import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import config from "../../config";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await authService.registerUser(payload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User registered successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const { accessToken, refreshToken } = await authService.loginUser(payload);

  const isProduction = config.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: { accessToken, refreshToken },
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await authService.getMyProfile(req.user!.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User profile fetched successfully",
    data: { profile },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.UNAUTHORIZED,
      message: "Refresh token not found",
      data: null,
    });
  }

  const result = await authService.refreshToken(refreshToken);

  const isProduction = config.NODE_ENV === "production";

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Access token refreshed successfully",
    data: { accessToken: result.accessToken },
  });
});

export const authController = {
  registerUser,
  loginUser,
  getMyProfile,
  refreshToken,
};
