import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TwoFALoginModal } from "./TwoFALoginModal";
import { apiUrl } from "../../api/api";
import { useTranslation } from "react-i18next";

export const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [twoFATempToken, setTwoFATempToken] = useState<string | null>(null);
	const [isTwoFAModalOpen, setIsTwoFAModalOpen] = useState(false);
	const navigate = useNavigate();
	const {t} = useTranslation();

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);

		if (params.get("twoFA") === "1") {
			const token = params.get("token");

			if (token)
			{
				setTwoFATempToken(token);
				setIsTwoFAModalOpen(true);
			}

			// 🔐 remove token from URL
			window.history.replaceState({}, "", "/login");
		}
	}, []);

	const handleLogin = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		setError("");

		try {
			const response = await fetch( apiUrl('/auth/login'),
			{
				method: "POST",
				credentials: "include",
				headers:{
					"Content-Type": "application/json",
				},
				body: JSON.stringify({email, password,}),
			});
			const data = await response.json();

			// Check for actual errors first (4xx, 5xx with error field)
			if (!response.ok && data.error)
			{
				if ( response.status === 409 && data.message === "Already logged in" )
				{
					navigate("/home");
					return;
				}

				throw new Error(data.error || t("error.loginRetry") );
			}

			// 2FA required flow - check this BEFORE normal login
			if (data.status === "TWO_FA_REQUIRED" && data.tempToken)
			{
				console.log("2FA required, opening modal");
				setTwoFATempToken(data.tempToken as string);
				setIsTwoFAModalOpen(true);
				return;
			}

			// Normal login flow
			if (data.message === "Login successful")
			{
				console.log("Normal login successful, navigating to home");
				navigate("/home");
			}
			else
			{
				throw new Error(data.message || t("error.tryAgain") );
			}
		}
		catch (err: any) {
			console.error("Login error:", err);
			setError(err.message || t("error.tryAgain") );
		};
	};

	return (
		<>
			<form onSubmit={handleLogin} className="flex flex-col pt-[5vh] items-center font-transcendence-two text-transcendence-white text-left gap-10 landscape:gap-5 lg:landscape:gap-10">
				<input
					type="text"
					placeholder={t("welcome.placeholder.email")}
					onChange={(e) => setEmail(e.target.value)}
					className="border-1 rounded-lg placeholder:text-lg px-3 text-lg w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
				<input
					type="password"
					placeholder={t("welcome.placeholder.password")}
					onChange={(e) => setPassword(e.target.value)}
					className="border-1 rounded-lg placeholder:text-lg px-3 text-2xl w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
				{error && <div className="text-red-500 text-sm landscape:text-xs lg:landscape:text-sm">{error}</div>}
				<div className="bg-transcendence-beige flex rounded-2xl w-35 h-18 align-center text-md font-bold justify-center text-center mt-5 tracking-wider landscape:text-xs landscape:w-20 landscape:h-14 lg:landscape:text-lg lg:landscape:w-35 lg:landscape:h-18">
					<button className="text-transcendence-black cursor-pointer hover:pt-2" type="submit">
						{t("welcome.button.login")}
					</button>
				</div>
			</form>
			<TwoFALoginModal
				isOpen={isTwoFAModalOpen}
				tempToken={twoFATempToken}
				onSuccess={() => navigate("/home")}
				onClose={() => setIsTwoFAModalOpen(false)}
			/>
		</>
	);
};
