import { useState } from "react";
import { BaseModal } from "./BaseModal";
import { forceLogout } from "../../../api/forceLogout";
import { fetchWithAuth } from "../../../api/fetchWithAuth";
import { apiUrl } from "../../../api/api";

type DeleteAccountModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteAccountModal = ({ isOpen, onClose }: DeleteAccountModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  	    let message = "Account deletion failed";
  	    if (!res.ok) {
  	    	try
			{
  	    	  	const data = await res.json();
  	    	  	if (data?.error) message = data.error;
  	    	}
			catch
			{
				// Do nothing
			}
  	    	throw new Error(message);
  	    }

 	     // Ensure httpOnly auth cookies are cleared server-side and redirect
 	     await forceLogout();
 	   } catch (err: unknown) {
 	     	const msg = err instanceof Error ? err.message : "Something went wrong. Please try again later.";
 	     	setError(msg);
 	     	setLoading(false);
 	   }
  };

  return (
    	<BaseModal
			isOpen={isOpen}
			title="Delete Account"
			onClose={onClose}>
    		<p className="text-xs text-transcendence-white/80">
    	    	This action is permanent. Your account and data will be deleted.
    	  	</p>

    	  	{error && <div className="text-red-500 text-xs mt-2">{error}</div>}

    	  	<form onSubmit={handleDelete} className="flex flex-col gap-3 mt-3">
    	    	<button
    	    	  type="submit"
    	    	  disabled={loading}
    	    	  className="bg-transcendence-red text-transcendence-white rounded-xl py-2 text-sm font-semibold disabled:opacity-60"
    	    	>
    	    	  	{loading ? "Deleting…" : "Delete account"}
    	    	</button>
    	    	<button
    	    	  	type="button"
    	    	  	onClick={onClose}
    	    	  	disabled={loading}
    	    	  	className="border border-transcendence-beige text-transcendence-white rounded-xl py-2 text-sm"
    	    	>
    	      		Cancel
    	    	</button>
    	  	</form>
    	</BaseModal>
  	);
};
