import React from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
	children: React.ReactNode;
};


/*
	Check that user is authenticated before allowing access to /home.
	We send a cookie. The backend checks that the cookie cotains of a valid JWT token.
*/
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		const checkAuth = async () => {
			try
			{
				const response = await fetch("http://localhost:4241/auth/me", {
					method: "GET",
					credentials: "include",
				});
				setIsAuthenticated(response.ok);
			}
			catch
			{
				setIsAuthenticated(false);
			}
		};
		checkAuth();
	}, []);
	if (isAuthenticated === null)
		return (
			<div className="w-screen h-screen bg-transcendence-black text-white font-transcendence-two text-center flex flex-col justify-center align-center">
				<h1>Loading...</h1>
			</div>
		);
	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>
};