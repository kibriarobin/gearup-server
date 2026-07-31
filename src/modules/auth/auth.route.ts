import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post("/register", authController.registerUser);

router.post("/login", authController.loginUser);

router.post("/refresh-token", authController.refreshToken);

router.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.PROVIDER, UserRole.CUSTOMER),
  authController.getMyProfile,
);

export const authRoutes = router;
