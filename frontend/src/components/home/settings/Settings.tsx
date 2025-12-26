import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector"
import { TwoFAModal } from "./TwoFAModal";
import { apiUrl } from "../../../api/api";
import { fetchWithAuth } from "../../../api/fetchWithAuth";
import { useTranslation } from "react-i18next";
import { DeleteAccountModal } from "./DeleteAccountModal";

export const Settings = () =>
{
	const [error, setError] = useState<string | null>(null);
	const [isTwoFAModalOpen, setIsTwoFAModalOpen] = useState(false);
	const [isTwoFAEnabled, setIsTwoFAEnabled] = useState<boolean | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const navigate = useNavigate();

	const { t } = useTranslation();

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
			if (!response.ok) throw new Error(t("error.logoutFailure") );

			navigate("/");
		}
		catch (err: any) {
			setError(err.message || t("error.tryAgain") );
		};
	}

	return (
		<>
			<div className="flex flex-col gap-6 lg:gap-15 portrait:items-center lg:landscape:items-center justify-center">
				{error && <div className="text-red-500 text-sm landscape:text-xs lg:landscape:text-sm text-center">{error}</div>}
				<LanguageSelector/>
				<div className="flex flex-col gap-2">
					<button
						className="landscape:text-left lg:landscape:text-center text-transcendence-white font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer relative after:content-[attr(data-text)] after:font-bold after:h-0 after:invisible after:overflow-hidden after:select-none after:block"
						data-text={isTwoFAEnabled ? t("twoFA.disable") : t("twoFA.enable")}
						onClick={() => setIsTwoFAModalOpen(true)}>
						{isTwoFAEnabled
							? <span className="hover:font-bold">{t("twoFA.disable")}</span>
							: <span className="hover:font-bold">{t("twoFA.enable")}</span>}
					</button>
					<button
						className="landscape:text-left lg:landscape:text-center text-transcendence-white font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer relative after:content-[attr(data-text)] after:font-bold after:h-0 after:invisible after:overflow-hidden after:select-none after:block"
						data-text={t("settings.logout")}
						onClick={handleLogOut}>
						<span className="hover:font-bold">
							{t("settings.logout")}
						</span>
					</button>
					<button
						className="landscape:text-left lg:landscape:text-center text-transcendence-red-light font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer w-full relative after:content-[attr(data-text)] after:font-bold after:h-0 after:invisible after:overflow-hidden after:select-none after:block"
						data-text={t("settings.deleteAccount")}
						onClick={() => setIsDeleteModalOpen(true)}>
						<span className="hover:font-bold">{t("settings.deleteAccount")}</span>
					</button>
				</div>
			</div>
            <TwoFAModal
                isOpen={isTwoFAModalOpen}
                mode={isTwoFAEnabled ? "disable" : "enable"}
                onClose={() => setIsTwoFAModalOpen(false)}
                onStatusChange={handleTwoFAStatusChange}
            />
			<DeleteAccountModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
			/>
		</>
	);
}
