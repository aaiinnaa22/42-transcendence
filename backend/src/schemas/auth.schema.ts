import { z } from "zod";
import {
	emailField, usernameField, passwordField,
	twoFACodeField
} from '../shared/utility/validation.utility.js';

// Export auth route schemas

export const RegisterSchema = z.strictObject({
	email: emailField,
	password: passwordField,
	username: usernameField
});

export const LoginSchema = z.strictObject({
	email: emailField,
	password: passwordField
});

export const TwoFAVerifySchema = z.strictObject({
	code: twoFACodeField
});

export const TwoFALoginSchema = z.strictObject({
	code: twoFACodeField,
	tempToken: z.string().min(1, {message: "Token required"})
});

export const TwoFADisableSchema = z.strictObject({
	code: twoFACodeField
});

// Export types

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type TwoFAVerifyInput = z.infer<typeof TwoFAVerifySchema>;
export type TwoFALoginInput = z.infer<typeof TwoFALoginSchema>;
export type TwoFADisableInput = z.infer<typeof TwoFADisableSchema>;
