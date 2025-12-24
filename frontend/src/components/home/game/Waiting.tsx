import { useTranslation } from "react-i18next";

interface WaitingProps {
	opponent: string;
}

export const Waiting = ({ opponent }: WaitingProps) =>
{
	const {t} = useTranslation();

	return (
		<div className="relative w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] flex justify-center items-center">
			<h2 className="text-transcendence-white font-transcendence-three text-3xl tracking-[0.12em] text-center">
				{t("game.condition.waiting", { player: opponent })}
			</h2>
		</div>
	);
};
