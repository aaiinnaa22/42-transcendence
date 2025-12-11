import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector";
import { TwoFAModal } from "./TwoFAModal";

export const Settings = () =>
{
	const [error, setError] = useState<string | null>(null);
	const [isTwoFAModalOpen, setIsTwoFAModalOpen] = useState(false);
	const [isTwoFAEnabled, setIsTwoFAEnabled] = useState<boolean | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const loadTwoFAStatus = async () => {
			try {
				const res = await fetch("http://localhost:4241/auth/me", {
					credentials: "include",
				});
				if (!res.ok) throw new Error("Failed to fetch user info");
				
				const data = await res.json();
				setIsTwoFAEnabled(Boolean(data.twoFAEnabled));
			} catch (err: any) {
				console.error("Error fetching 2FA status:", err);
				setError(err.message || "Could not load settings.");
			}
		};				

		loadTwoFAStatus();
	}, []);

	const handleTwoFAStatusChange = (enabled: boolean) => {
        setIsTwoFAEnabled(enabled);
    };

	const handleLogOut = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		setError(null);

		try {
			const response = await fetch("http://localhost:4241/auth/logout",
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
      <div className="flex flex-col gap-6 lg:gap-15 items-center justify-center">
        {error && (
          <div className="text-transcendence-red text-sm text-center">
            {error}
          </div>
        )}

        <LanguageSelector />

        <div className="flex flex-col gap-2 text-center">
          <button
            className="text-transcendence-white font-transcendence-two text-sm font-semibold hover:font-bold"
            onClick={() => setIsTwoFAModalOpen(true)}
          >
            {isTwoFAEnabled
              ? "Disable two-factor authentication"
              : "Enable two-factor authentication"}
          </button>

          <button
            className="text-transcendence-white font-transcendence-two text-sm font-semibold hover:font-bold"
            onClick={handleLogOut}
          >
            Log out
          </button>

          <button className="text-transcendence-red font-transcendence-two text-sm font-semibold hover:font-bold">
            Delete account
          </button>
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
};