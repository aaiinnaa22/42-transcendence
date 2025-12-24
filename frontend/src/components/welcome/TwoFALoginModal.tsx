import { useState } from "react";
import { apiUrl } from "../../api/api";
import { useTranslation } from "react-i18next";

type TwoFALoginModalProps = {
    isOpen: boolean;
    tempToken: string | null;
    onSuccess: () => void;
    onClose: () => void;
};

export const TwoFALoginModal = ({ isOpen, tempToken, onSuccess, onClose }: TwoFALoginModalProps) =>
{
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);

	const {t} = useTranslation();

    if (!isOpen || !tempToken)
        return null;

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        if (!code.trim()) {
            setError(t("error.twoFALoginInfo"));
            return;
        }

        try {
            setVerifying(true);
            setError(null);

            const response = await fetch( apiUrl('/auth/2fa/login'), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim(), tempToken }),
            });

            const data = await response.json();

            if (!response.ok || data.error)
                throw new Error(t("twoFA.invalidCodeFailure"));

            setSuccess(true);
            onSuccess();

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t("error.QRLoadFailure");
            setError(message);
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-transcendence-black text-transcendence-white rounded-2xl p-6 w-80 max-w-full font-transcendence-two flex flex-col gap-4">

                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold tracking-wide">
						{t("twoFA.login")}
					</h2>
                    <button onClick={onClose} className="text-transcendence-white/70 hover:text-transcendence-white text-xl leading-none px-1">×</button>
                </div>

                <p className="text-xs text-transcendence-white/80">
					{t("error.twoFALoginInfo")}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder={t("twoFA.placeholder")}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="border border-transcendence-beige bg-transparent rounded-lg px-3 py-2 text-sm tracking-widest text-center placeholder:text-xs"
                    />

                    {error && <div className="text-red-500 text-xs min-h-[1rem]">{error}</div>}

                    <button
                        type="submit"
                        disabled={verifying}
                        className="mt-1 bg-transcendence-beige text-transcendence-black rounded-xl py-2 text-sm font-semibold tracking-wide hover:bg-opacity-90 disabled:bg-opacity-60 disabled:cursor-not-allowed"
                    >
                        {verifying ? t("twoFA.verifyMessage") : t("twoFA.verifyAndLogin")}
                    </button>

                    {success && (
                        <div className="text-green-400 text-xs text-center mt-1">
                            {t("twoFA.loginSuccess")}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
