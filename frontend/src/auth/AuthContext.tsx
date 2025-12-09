import { createContext, useContext, useEffect, useState } from 'react';

//maybe add set authenticated later
type AuthState = {
	ready: boolean;
	authenticated: boolean;
	setAuthenticated: (v: boolean) => void;
};

const AuthContext = createContext<AuthState>({ 
	ready: false, 
	authenticated: false 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [ready, setReady] = useState(false);
	const [authenticated, setAuthenticated] = useState(false);

	useEffect(() => {
		fetch("http://localhost:4241/auth/refresh", {
			method: "POST",
			credentials: "include"
		})
			.then(res => { setAuthenticated(res.ok); })
			.catch(() => { setAuthenticated(false); })
			.finally(() => { setReady(true); });
		}, []);
	
	return (
		<AuthContext.Provider value={{ ready, authenticated, setAuthenticated }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}