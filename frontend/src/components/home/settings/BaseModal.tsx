import { useTranslation } from "react-i18next";

export const BaseModal = ({ isOpen, title, onClose, children }: any) => {
	const {t} = useTranslation();

	if (!isOpen) return null;

	return (
    	<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    		<div className="border border-white bg-transcendence-black text-transcendence-white rounded-2xl p-6 w-80 max-w-full font-transcendence-two flex flex-col gap-4">
        		<div className="flex justify-between items-center">
          			<h2 className="text-lg font-semibold tracking-wide">
						{title}
					</h2>
         			 <button
					 	onClick={onClose}
						className="text-transcendence-white/70 hover:text-transcendence-white text-xl leading-none px-1"
						aria-label={t("utils.close")}>
							×
						</button>
        		</div>
        		{children}
      		</div>
    	</div>
  	);
};
