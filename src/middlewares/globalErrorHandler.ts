import { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";

function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let errorMessage = "Internal Server Error";
  let errorDetails = err;

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "You provided incorrect field type or missing fields";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 400;
      errorMessage =
        "An operation failed because it depends on one or more records that were required but not found. ";
    } else if (err.code === "P2002") {
      statusCode = 400;
      errorMessage = "Duplicate key Error";
    } else if (err.code === "P2003") {
      statusCode = 400;
      errorMessage = "Foreign key Error";
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "An unknown error occurred in the Prisma Client.";
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    errorMessage = "A panic occurred in the Prisma Client.";
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = 401;
      errorMessage =
        "Authentication failed. Please check your database credentials.";
    } else if (err.errorCode === "P1001") {
      statusCode = 400;
      errorMessage = "Can't reach database server";
    }
  }

  res.status(statusCode);
  res.json({ message: errorMessage, error: errorDetails });
}

export default errorHandler;
