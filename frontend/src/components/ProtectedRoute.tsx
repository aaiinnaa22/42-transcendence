import React from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
	children: React.ReactNode;
}


/*
	Check that user is authenticated before allowing access to /home.
	We send a cookie. The backend checks that the cookie cotains of a valid JWT token.
*/
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		const checkAuth = async () => {
			try
			{
				const response = await fetch("??", {
					method: "GET",
					credentials: "include",
				});
				if (response.ok)
					setIsAuthenticated(true);
				else
					setIsAuthenticated(false);
			}
			catch
			{
				setIsAuthenticated(false);
			}
		};
		checkAuth();
	}, []);

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>
}