import { Prisma } from "@prisma/client";
import { type FastifyReply } from "fastify";
import { type ZodError } from "zod";

// Helper class for throwing error messages with a specific code
export class HttpError extends Error
{
	statusCode: number;

	constructor( message: string, statusCode: number = 500 )
	{
		super( message );
		this.name = "HttpError";
		this.statusCode = statusCode;
	}
};

// Additional utility functions with overridable messages
export const BadRequestError = ( message: string = "Bad Request" ) => new HttpError( message, 400 );
export const UnauthorizedError = ( message: string = "Unauthorized" ) => new HttpError( message, 401 );
export const ForbiddenError = ( message: string = "Forbidden" ) => new HttpError( message, 403 );
export const NotFoundError = ( message: string = "Not Found"  ) => new HttpError( message, 404 );
export const ConflictError = ( message: string = "Conflict" ) => new HttpError( message, 409 );
export const InternalServerError = ( message: string = "Internal Server Error" ) => new HttpError( message, 500 );
export const ServiceUnavailableError = ( message: string = "Service Unavailable" ) => new HttpError( message, 503 );

export const sendErrorReply = (
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred"
) => {
  let statusCode = 500;
  let userMessage: string = fallbackMessage;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 500;
    userMessage = "An unexpected database error occurred.";
  } else if (error instanceof HttpError) {
    statusCode = error.statusCode;
    userMessage = error.message;
  } else if (error instanceof Error) {
    userMessage = error.message;
  }

  reply.code(statusCode).send({ error: userMessage });
};