import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ILoginUserPayload, IRegisterUserPayload } from "./auth.interface";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";
import { validateLogin, validateRegister } from "../../utils/validate";
import { JwtPayload } from "jsonwebtoken";

const registerUser = async (payload: IRegisterUserPayload) => {
  const validationError = validateRegister(payload);
  if (validationError) {
    throw new Error(validationError);
  }

  const { name, email, password, profilePhoto, role } = payload;

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new Error("User already exists with this email");
  }

  const hashPassword = await bcrypt.hash(
    password,
    Number(config.BCRYPT_SALT_ROUNDS),
  );

  const userRole = role || "CUSTOMER";

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashPassword,
      role: userRole,
      profile: {
        create: {
          profilePhoto,
        },
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: createdUser.id,
      email: createdUser.email || email,
    },
    omit: { password: true },
    include: {
      profile: true,
    },
  });
  return user;
};

const loginUser = async (payload: ILoginUserPayload) => {
  const validationError = validateLogin(payload);
  if (validationError) {
    throw new Error(validationError);
  }

  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User does not exist");
  }

  if (user?.status === "SUSPENDED") {
    throw new Error("Your account has been suspended");
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user?.password as string,
  );

  if (!isPasswordMatched) {
    throw new Error("Incorrect password");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.JWT_ACCESS_SECRET,
    config.JWT_ACCESS_EXPIRATION,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.JWT_REFRESH_SECRET,
    config.JWT_REFRESH_EXPIRATION,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    omit: { password: true },
    include: {
      profile: true,
    },
  });
  return user;
};

const refreshToken = async (refreshToken: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    config.JWT_REFRESH_SECRET,
  );

  if (!verifiedRefreshToken.success) {
    throw new Error(verifiedRefreshToken.error);
  }

  const { id } = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
  });

  if (user.status === "SUSPENDED") {
    throw new Error("Your account has been suspended");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.JWT_ACCESS_SECRET,
    config.JWT_ACCESS_EXPIRATION,
  );

  return { accessToken };
};

export const authService = {
  registerUser,
  loginUser,
  getMyProfile,
  refreshToken,
};
