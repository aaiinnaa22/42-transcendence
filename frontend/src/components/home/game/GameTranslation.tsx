import type { TFunction } from "i18next";

type GameEndData = {
	type: "end";
	mode: "singleplayer" | "tournament" | "invite";
	reason: "win" | "disconnect" | "inactivity";
	winner?: string;
	loser?: string;
	score?: {
		winner?: number;
		loser?: number;
	};
};

export function getGameEndMessage(data: GameEndData, t: TFunction): string
{
	const { mode, reason, winner, loser } = data;

	if ( mode === "singleplayer" )
	{
		if (reason === "win") {
			if (!winner) return t("game.state.end.gameover");
			const side = t(`game.players.${winner}`);
			if (!side) return t("game.state.end.gameover");

			return t("game.state.end.singleplayer.win", { winner: side });
		} else if (reason === "inactivity") {
			return t("game.state.end.singleplayer.inactivity");
		} else if (reason === "disconnect"){
			return t("game.state.end.singleplayer.disconnect");
		}
	}

	if ( mode === "tournament" )
	{
		if (reason === "win") {
			return t("game.state.end.tournament.win", { winner });
		} else if (reason === "inactivity") {
			return t("game.state.end.tournament.inactivity", { loser });
		} else if (reason === "disconnect") {
			return t("game.state.end.tournament.disconnect", { loser });
		}
	}

	if ( mode === "invite" )
	{
		if (reason === "win") {
			return t("game.state.end.invite.win", { winner });
		} else if (reason === "inactivity") {
			return t("game.state.end.invite.inactivity", { loser });
		} else if (reason === "disconnect"){
			return t("game.state.end.invite.disconnect", { loser });
		}
	}

	return t("game.state.end.unknwon");
};

export function getWaitingMessage(mode: "tournament" | "invite", opponent: string, t: TFunction): string
{
	if (mode === "tournament")
	{
		return t("game.state.waiting.tournament");
	}

	return t("game.state.waiting.invite", { opponent });
}
