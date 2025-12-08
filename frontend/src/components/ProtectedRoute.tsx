import React from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchWithAuth } from "../api/fetchWithAuth";

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
			try {
				const response = await fetchWithAuth("http://localhost:4241/auth/me");
				setIsAuthenticated(response.ok);
			}
			catch {
				setIsAuthenticated(false);
			}
		};
		checkAuth();
	}, []);

	if (isAuthenticated === null) {
    	return <div>Loading...</div>;
  	}

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
};