import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../../api/fetchWithAuth";
import { forceLogout } from "../../api/forceLogout";
import { apiUrl } from "../../api/api";
import { useTranslation } from "react-i18next";
import { GameEnd } from "./GameEndInvite";

export const PlayButton = ({ gameEndData, setGameEndData }: { gameEndData: { message: string } | null; setGameEndData: (data: { message: string } | null) => void; }) =>
{
	void setGameEndData; // to avoid unused variable warning if not used
	const navigate = useNavigate();
	const {t} = useTranslation();

	const handlePlay = async () => {
		try {
			const res = await fetchWithAuth(apiUrl("/auth/me"));

			if (!res.ok) {
				forceLogout();
				return;
			}

			navigate("/home/play/choose");
		} catch {
			forceLogout();
		}
	};

	return (
		<div className="flex flex-col items-center justify-center w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)]">
			{gameEndData && <GameEnd message={gameEndData.message} />}
			<button
				className="group relative bg-transcendence-beige rounded-[3rem] w-70 h-40 text-transcendence-black font-transcendence-three tracking-[0.1em] text-5xl cursor-pointer overflow-hidden"
				onClick={handlePlay}
			>
				{t("home.button.play")}
				<span className="absolute bottom-[35%] right-[26%] w-4 h-4 border-2 border-transcendence-black bg-white rounded-full transform -translate-y-1/2 translate-x-2 group-hover:animate-[pingpongAnimation_1s_ease-in-out]" />
			</button>
		</div>
	);
}
