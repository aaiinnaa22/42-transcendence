import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector"
import { TwoFAModal } from "./TwoFAModal";
import { apiUrl } from "../../../api/api";
import { fetchWithAuth } from "../../../api/fetchWithAuth";

export const Settings = () =>
{
	const [error, setError] = useState<string | null>(null);
	const [isTwoFAModalOpen, setIsTwoFAModalOpen] = useState(false);
	const [isTwoFAEnabled, setIsTwoFAEnabled] = useState<boolean | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const loadTwoFAStatus = async () => {
			try {
				const res = await fetchWithAuth( apiUrl('/auth/me'), {
					method: "GET",
					credentials: "include",
				});

				if (!res.ok) return;

				const user = await res.json();
				setIsTwoFAEnabled(Boolean(user.twoFAEnabled));
			} catch {
				// silently fail
			}
		};

		loadTwoFAStatus();
	}, []);

	const handleTwoFAStatusChange = (enabled: boolean) => {
        setIsTwoFAEnabled(enabled);
    };

	if (isTwoFAEnabled === null) {
    	return null;
	}

	const handleLogOut = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		setError(null);

		try {
			const response = await fetch( apiUrl('/auth/logout'),
			{
				method: "POST",
				credentials: "include",
			});

			// Did we get a response code of 2xx (success)
			if (!response.ok)
			{
				const data = await response.json();
				throw new Error(data.error || "Logout failed");
			}

			navigate("/");
		}
		catch (err: any) {
			console.error("Login error:", err);
			setError(err.message || "Something went wrong. Please try again later.");
		};
	}

	return (
		<>
			<div className={"flex flex-col gap-6 lg:gap-15 items-center justify-center"}>
				{error && <div className="text-red-500 text-sm landscape:text-xs lg:landscape:text-sm text-center">{error}</div>}
				<LanguageSelector/>
				<div className={"flex flex-col gap-2 text-center"}>
					<button
						className="text-transcendence-white font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer hover:font-bold"
						onClick={() => setIsTwoFAModalOpen(true)}
					>
						{isTwoFAEnabled
							? "Disable two-factor authentication"
							: "Enable two-factor authentication"}
					</button>
					<button
						className="text-transcendence-white font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer hover:font-bold"
						onClick={handleLogOut}>
						Log out
					</button>
					<button className="text-transcendence-red font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer hover:font-bold w-full">Delete account</button>
				</div>
			</div>
            <TwoFAModal
                isOpen={isTwoFAModalOpen}
                mode={isTwoFAEnabled ? "disable" : "enable"}
                onClose={() => setIsTwoFAModalOpen(false)}
                onStatusChange={handleTwoFAStatusChange}
            />
		</>
	);
}
