import { useEffect, useState } from "react";
import { apiUrl } from "../../../api/api";
import { BaseModal } from "./BaseModal";
import { fetchWithAuth } from "../../../api/fetchWithAuth";
import { useTranslation } from "react-i18next";

type TwoFAMode = "enable" | "disable";

type TwoFAModalProps = {
    isOpen: boolean;
    mode: TwoFAMode;
    onClose: () => void;
    onStatusChange?: (enabled: boolean) => void;
};

export const TwoFAModal = ({ isOpen, mode, onClose, onStatusChange, }: TwoFAModalProps) =>
{
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);

	const { t } = useTranslation();

    // Reset when closed / reopen
    useEffect(() => {
        if (!isOpen) {
            setQrCode(null);
            setCode("");
            setError(null);
            setVerifying(false);
            setSuccess(false);
            return;
        }
        if (mode === "disable") {
            return;
        }

        const fetchQr = async () => {
            try {
                setError(null);
                const response = await fetchWithAuth( apiUrl('/auth/2fa/setup'), {
                    method: "POST",
                    credentials: "include",
                });

                const data = await response.json();

                if (!response.ok || data.error)
                    throw new Error(data.error || "Failed to start 2FA setup");

                if (!data.qrCode)
                    throw new Error("QR code not received from server");

                setQrCode(data.qrCode);

            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load QR code";
                setError(message);
            }
        };

        fetchQr();
    }, [isOpen, mode]);

    useEffect(() => {
        if (!success) return;

        if (countdown <= 0) {
            onClose();
            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [success, countdown, onClose]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            setError(t("twoFA.enterCode"));
            return;
        }

        try {
            setVerifying(true);
            setError(null);

            const endpoint =
                mode === "enable"
                    ? apiUrl('/auth/2fa/verify')
                    : apiUrl('/auth/2fa/disable');

            const response = await fetchWithAuth(endpoint, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() }),
            });

            const data = await response.json();

            if (!response.ok || data.error)
                throw new Error(data.error || "Failed to verify 2FA code");

            setSuccess(true);
            const newStatus = mode === "enable";
            onStatusChange?.(newStatus);

            setCountdown(5); // Reset countdown on new success
        } catch (err: any) {
            setError(err.message || "Failed to verify 2FA code");
        } finally {
            setVerifying(false);
        }
    };

    if (!isOpen) return null;

    const loadingQr = mode === "enable" && !qrCode && !error;

    return (
        <BaseModal
            isOpen={isOpen}
            title={mode === "enable" ? t("twoFA.enable") : t("stwoFA.disable")}
            onClose={onClose}
        >
            <p className="text-xs text-transcendence-white/80">
                {mode === "enable"
                    ? t("twoFA.scanToEnable")
                    : t("twoFA.codeToDisable") }
            </p>

            {mode === "enable" && (
                <div className="flex flex-col items-center gap-3">
                    {loadingQr && <div className="text-sm text-transcendence-white/70">Generating QR code…</div>}
                    {error && !qrCode && <div className="text-red-500 text-xs">{error}</div>}
                    {qrCode && (
                        <img
                            src={qrCode}
                            alt="2FA QR code"
                            className="w-40 h-40 border border-transcendence-beige rounded-lg bg-white"
                        />
                    )}
                </div>
            )}

            <form onSubmit={handleVerify} className="flex flex-col gap-3 mt-2">
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="border border-transcendence-beige bg-transparent rounded-lg px-3 py-2 text-sm tracking-widest text-center placeholder:text-xs"
                />

                {error && (
                    <div className="text-red-500 text-xs min-h-[1rem]">{error}</div>
                )}

                <button
                    type="submit"
                    disabled={verifying || (mode === "enable" && loadingQr)}
                    className="bg-transcendence-beige text-transcendence-black rounded-xl py-2 text-sm font-semibold"
                >
                    {verifying
                        ? t("twoFA.verifyMessage")
                        : mode === "enable"
                            ? t("twoFA.verifyToEnable")
                            : t("twoFA.verifyToDisable")}
                </button>

                {success && (
                    <div className="text-green-400 text-xs text-center">
                        {mode === "enable"
                            ? t("twoFA.enableSuccess")
                            : t("twoFA.disableSuccess")}
                        {t("twoFA.modalClosing", {countdown})}
                    </div>
                )}
            </form>
        </BaseModal>
    );
};
