import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector";
import { TwoFAModal } from "./TwoFAModal";

type SettingsProps = {
  twoFAEnabled: boolean;
  onTwoFAChange: (enabled: boolean) => void;
};

export const Settings = ({
  twoFAEnabled,
  onTwoFAChange,
}: SettingsProps) => {
  const [error, setError] = useState("");
  const [isTwoFAModalOpen, setIsTwoFAModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await fetch("http://localhost:4241/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 lg:gap-15 items-center justify-center">
        <LanguageSelector />

        <div className="flex flex-col gap-2 text-center">
          <button
            className="text-transcendence-white font-transcendence-two text-sm font-semibold hover:font-bold"
            onClick={() => setIsTwoFAModalOpen(true)}
          >
            {twoFAEnabled
              ? "Disable two-factor authentication"
              : "Enable two-factor authentication"}
          </button>

          <button
            className="text-transcendence-white font-transcendence-two text-sm font-semibold hover:font-bold"
            onClick={handleLogOut}
          >
            Log out
          </button>

          {error && (
            <div className="text-transcendence-red text-sm">{error}</div>
          )}
        </div>
      </div>

      <TwoFAModal
        isOpen={isTwoFAModalOpen}
        mode={twoFAEnabled ? "disable" : "enable"}
        onClose={() => setIsTwoFAModalOpen(false)}
        onStatusChange={onTwoFAChange}
      />
    </>
  );
};
