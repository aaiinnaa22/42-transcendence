import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface ProtectedRouteProps {
	children: React.ReactNode;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const { ready, authenticated } = useAuth();

	if (!ready) {
		return <div>Loading...</div>;
	}

	if (!authenticated) {
		return <Navigate to="/welcome" replace />;
	}

	return <>{children}</>;	
};