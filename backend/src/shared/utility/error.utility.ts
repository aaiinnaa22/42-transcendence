import { type FastifyReply } from "fastify";

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
export const NotFoundError = ( message: string = "Not Found" ) => new HttpError( message, 404 );
export const ConflictError = ( message: string = "Conflict" ) => new HttpError( message, 409 );
export const InternalServerError = ( message: string = "Internal Server Error" ) => new HttpError( message, 500 );
export const ServiceUnavailableError = ( message: string = "Service Unavailable" ) => new HttpError( message, 503 );

// Utility for sending replies with the HttpError class
export const sendErrorReply = ( reply: FastifyReply, error: any, message: string = "An error occured" ) =>
{
	const statusCode = error instanceof HttpError ? error.statusCode : 500;
	const replyMessage = error instanceof HttpError ? error.message : message;
	reply.code( statusCode ).send( { error: replyMessage } );
};
