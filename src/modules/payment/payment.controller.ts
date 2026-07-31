import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import config from "../../config";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const result = await paymentService.createPayment(customerId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Payment session created successfully",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  console.log("SSLCommerz callback:", {
    method: req.method,
    body: req.body,
    query: req.query,
  });

  const tranId = (req.body?.tran_id || req.query?.tran_id) as string;
  const valId = (req.body?.val_id || req.query?.val_id) as string;

  if (!tranId || !valId) {
  return res.redirect(`${config.FRONTEND_URL}/payment/cancel`);
}

try {
  const result = await paymentService.confirmPayment(tranId, valId);

  return res.redirect(
    `${config.FRONTEND_URL}/payment/success?orderId=${result.rentalOrderId}`,
  );
} catch (error) {
  return res.redirect(`${config.FRONTEND_URL}/payment/cancel`);
}
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const result = await paymentService.getMyPayments(customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments fetched successfully",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const customerId = req.user?.id;
  const result = await paymentService.getPaymentById(
    id as string,
    customerId as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment fetched successfully",
    data: result,
  });
});

export const paymentController = {
  createPayment,
  confirmPayment,
  getMyPayments,
  getPaymentById,
};
