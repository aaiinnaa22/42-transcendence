import { useTranslation } from "react-i18next";

type ExitTopLeftProps =
{
	onExitClick: () => void;
	children?: React.ReactNode;
}

export const ExitTopLeft = ({ onExitClick, children }: ExitTopLeftProps) =>
{
	const {t} = useTranslation();

	return (
		<div className="relative">
			<button
				className="absolute z-10 text-transcendence-white material-symbols-outlined text-left cursor-pointer top-3 left-3 xl:top-10 xl:left-10"
				onClick={onExitClick}
				aria-label={t("utils.close")}>
				close
			</button>
			{children}
		</div>
	);
};
