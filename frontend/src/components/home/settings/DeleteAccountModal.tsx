import { useState } from "react";
import { BaseModal } from "./BaseModal";
import { forceLogout } from "../../../api/forceLogout";
import { fetchWithAuth } from "../../../api/fetchWithAuth";
import { apiUrl } from "../../../api/api";
import { useTranslation } from "react-i18next";

type DeleteAccountModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteAccountModal = ({ isOpen, onClose }: DeleteAccountModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {t} = useTranslation();

  if (!isOpen) return null;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try
	{
      	const res = await fetchWithAuth( apiUrl("/users/me"), {
      	  	method: "DELETE",
      	  	credentials: "include",
      	  	keepalive: true,
      	});

  	    if (!res.ok) {
  	    	throw new Error(t("error.accountDeletionFailure"));
  	    }

 	     // Ensure httpOnly auth cookies are cleared server-side and redirect
 	     await forceLogout();
 	   } catch (err: unknown) {
 	     	const msg = err instanceof Error ? err.message : t("error.tryAgain");
 	     	setError(msg);
 	     	setLoading(false);
 	   }
  };

  return (
    	<BaseModal
			isOpen={isOpen}
			title={t("account.deletion.title")}
			onClose={onClose}>
    		<p className="text-xs text-transcendence-white/80">
    	    	{t("account.deletion.warning")}
    	  	</p>

    	  	{error && <div className="text-red-500 text-xs mt-2">{error}</div>}

    	  	<form onSubmit={handleDelete} className="flex flex-col gap-3 mt-3">
    	    	<button
    	    	  type="submit"
    	    	  disabled={loading}
    	    	  className="bg-transcendence-red text-transcendence-white rounded-xl py-2 text-sm font-semibold disabled:opacity-60"
    	    	>
    	    	  	{loading ? t("account.button.deleting") : t("account.button.deleteAccount")}
    	    	</button>
    	    	<button
    	    	  	type="button"
    	    	  	onClick={onClose}
    	    	  	disabled={loading}
    	    	  	className="border border-transcendence-beige text-transcendence-white rounded-xl py-2 text-sm"
    	    	>
    	      		{t("account.button.cancel")}
    	    	</button>
    	  	</form>
    	</BaseModal>
  	);
};
