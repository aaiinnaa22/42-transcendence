import { useNavigate } from "react-router-dom"
import { useState } from "react";
import { getCurrentUser } from "../../../BackendFetch";

export const GameLobby = () =>
{
	const navigate = useNavigate();
	const {username, profilePic} = getCurrentUser();
	const [bothAreWaiting, setBothAreWaiting] = useState<boolean>(false);

	return (
		<div className="h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] flex justify-center items-center">
			<div className="grid grid-cols-[2fr_1fr_2fr] grid-rows-[3fr_1fr] gap-8 lg:gap-15">
				<div className="flex flex-col justify-center items-center gap-2">
					<img className="rounded-full aspect-square object-cover h-30 lg:h-50 p-2" src={profilePic}></img>
					<p className="text-white font-bold">{username}</p>
				</div>
				<div className="flex justify-center items-center">
					<h2 className="text-transcendence-white font-transcendence-one tracking-[0.3rem] text-2xl xl:text-4xl">VS</h2>
				</div>
				<div className="flex flex-col justify-center items-center gap-2">
					<span className="animate-spin rounded-full aspect-square h-10 border-6 border-gray-300 border-t-transparent"></span>
					<p className="text-white font-bold h-5"></p>
				</div>
				<div className="col-span-3 flex justify-center items-center">
					<h2 className="text-transcendence-white p-3 border-3 rounded-xl">{!bothAreWaiting ? "Waiting for another player..." : "Game starts in ...sec"}</h2>
				</div>
			</div>
		</div>
	)
}