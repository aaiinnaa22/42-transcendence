import { useEffect, useState } from "react";

type TwoFAModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export const TwoFAModal = ({ isOpen, onClose }: TwoFAModalProps) =>
{
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);

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

        const fetchQr = async () => {
            try {
                setError(null);
                const response = await fetch("http://localhost:4241/auth/2fa/setup", {
                    method: "POST",
                    credentials: "include",
                });

                const data = await response.json();

                if (!response.ok || data.error)
                    throw new Error(data.error || "Failed to start 2FA setup");

                if (!data.qrCode)
                    throw new Error("QR code not received from server");

                setQrCode(data.qrCode);

            } catch (err: any) {
                setError(err.message || "Failed to load QR code");
            }
        };

        fetchQr();
    }, [isOpen]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            setError("Please enter the 6-digit code from your authenticator app.");
            return;
        }

        try {
            setVerifying(true);
            setError(null);

            const response = await fetch("http://localhost:4241/auth/2fa/verify", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() }),
            });

            const data = await response.json();

            if (!response.ok || data.error)
                throw new Error(data.error || "Failed to verify 2FA code");

            setSuccess(true);

            setTimeout(() => onClose(), 1500);

        } catch (err: any) {
            setError(err.message || "Failed to verify 2FA code");
        } finally {
            setVerifying(false);
        }
    };

    if (!isOpen)
        return null;

    const loadingQr = !qrCode && !error;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-transcendence-black text-transcendence-white rounded-2xl p-6 w-80 max-w-full font-transcendence-two flex flex-col gap-4">

                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold tracking-wide">Two-Factor Authentication</h2>
                    <button onClick={onClose} className="text-transcendence-white/70 hover:text-transcendence-white text-xl leading-none px-1">×</button>
                </div>

                <p className="text-xs text-transcendence-white/80">
                    Scan the QR code with your authenticator app, then enter the code.
                </p>

                <div className="flex flex-col items-center justify-center gap-3">
                    {loadingQr && (
                        <div className="text-sm text-transcendence-white/70">Generating QR code…</div>
                    )}

                    {error && !qrCode && (
                        <div className="text-red-500 text-xs text-center">{error}</div>
                    )}

                    {qrCode && (
                        <img
                            src={qrCode}
                            alt="2FA QR code"
                            className="w-40 h-40 border border-transcendence-beige rounded-lg bg-white"
                        />
                    )}
                </div>

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

                    {error && qrCode && (
                        <div className="text-red-500 text-xs min-h-[1rem]">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loadingQr || verifying}
                        className="mt-1 bg-transcendence-beige text-transcendence-black rounded-xl py-2 text-sm font-semibold tracking-wide hover:bg-opacity-90 disabled:bg-opacity-60 disabled:cursor-not-allowed"
                    >
                        {verifying ? "Verifying…" : "Verify & Enable 2FA"}
                    </button>

                    {success && (
                        <div className="text-green-400 text-xs text-center mt-1">
                            2FA enabled successfully!
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
