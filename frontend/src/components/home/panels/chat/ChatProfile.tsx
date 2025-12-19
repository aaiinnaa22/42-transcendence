import type { ChatUser } from "./ChatContainer";
import { useBefriendUser, useBlockUser, fetchUserFromBackend } from "../../../../BackendFetch";
import { useEffect, useState } from "react";

type ChatProfileProps =
{
	onExitClick: () => void;
	user: ChatUser;
}

export const ChatProfile = ({onExitClick, user}: ChatProfileProps) => {
	const {unfriendUser, befriendUser} = useBefriendUser();
	const {unblockUser, blockUser} = useBlockUser();
	const [currentUser, setCurrentUser] = useState(user);

	const refreshUser = async () => {
		const freshUser = await fetchUserFromBackend(currentUser.username);
		if (freshUser)
			setCurrentUser(prev => ({
			...prev,
			...freshUser,
			online: prev.online,  // keep the existing online status if not included in freshUser
		}));
	}

	useEffect(() => {
		refreshUser();
	}, []);

	const handleFriendClick = async () => {
		const ok = currentUser.isFriend
			? await unfriendUser(currentUser.id)
			: await befriendUser(currentUser.id);
		if (ok)
			await refreshUser();
	}

	const handleBlockClick = async () => {
		const ok = currentUser.isBlockedByMe
			? await unblockUser(currentUser.id)
			: await blockUser(currentUser.id);
		if (ok)
			await refreshUser();
	}


	return (
		<div className="flex flex-col h-full w-full bg-transcendence-white lg:rounded-l-2xl px-3 pt-10 pb-5 lg:border-2">
			<div className="fixed top-0 w-[90%] lg:mt-[2px] h-10 bg-transcendence-white flex items-center">
				<button onClick={onExitClick} className="material-symbols-outlined !text-md cursor-pointer">arrow_back_ios_new</button>
			</div>
			<div className="overflow-y-auto flex flex-col h-full justify-between gap-5
				portrait:items-center portrait:px-[10%] portrait:gap-10
				lg:portrait:items-start lg:portrait:px-5
				landscape:grid grid-cols-[auto_auto] grid-rows-[20%_auto_15%] landscape:justify-center
				lg:landscape:flex lg:landscape:justify-between
				landscape:max-h-100 lg:landscape:max-h-none">
				<div className="flex flex-col items-center justify-center lg:gap-5 w-full flex-grow
					landscape:contents lg:landscape:flex">
					<div className="flex flex-col items-center justify-between w-full gap-2
						col-span-2
						landscape:flex-row landscape:border-b-2 lg:landscape:flex-col lg:landscape:border-b-0">
						<h2 className="font-bold text-md md:text-lg border-b-2 h-fit w-full
							portrait:text-center lg:portrait:text-left
							portrait:w-fit lg:portrait:w-full
							landscape:border-b-0 lg:landscape:border-b-2">{currentUser.username}</h2>
						<div className="flex w-full gap-1 items-center">
							<p className="text-xs md:text-sm text-right w-full">currently {currentUser.online ? "online" : "offline"}</p>
							<span className={"border-1 lg:border-2 w-2 h-2 lg:w-4 lg:h-4 rounded-full "
								+ (currentUser.online ? "bg-transcendence-green" : "bg-transcendence-red")}></span>
						</div>
					</div>
					<img className="rounded-full object-cover border-2 w-full max-w-40 aspect-square
						row-span-2 landscape:max-w-40 lg:landscape:max-w-40" src={currentUser.profile}></img>
				</div>
				<div className="grid grid-cols-[auto_auto] grid-rows-[auto_auto_auto] gap-5 w-full flex-grow
					landscape:flex flex-row lg:landscape:grid
					landscape:gap-3 lg:landscape:gap-5
					landscape:mb-8 landscape:py-5 lg:landscape:mb-0 lg:landscape:py-0
					landscape:max-h-40">
					<div className="col-span-2 w-full portrait:flex justify-center items-center
						landscape:hidden lg:landscape:flex">
						<h3 className="text-sm md:text-lg font-bold border-b-1 col-span-2 max-h-6
							portrait:w-fit lg:portrait:w-full w-full">stats</h3>
					</div>
					<div className="col-span-2 flex justify-center items-center border-2 rounded-lg p-2
						portrait:p-4 lg:portrait:p-2">
						<h4 className="text-xs md:text-sm"><span className="font-bold !text-md">{currentUser.stats.playedGames} </span> games played in total</h4>
					</div>
					<div className="bg-transcendence-beige flex flex-col justify-center items-center rounded-lg p-1
						portrait:p-4 lg:portrait:p-2">
						<h4 className="text-sm md:text-md font-bold">{currentUser.stats.wins}</h4>
						<p className="text-xs md:text-sm">games won</p>
					</div>
					<div className="bg-transcendence-black text-transcendence-white flex flex-col justify-center items-center rounded-lg p-1
						portrait:p-4 lg:portrait:p-2">
						<h4 className="text-sm md:text-md font-bold">{currentUser.stats.losses}</h4>
						<p className="text-xs md:text-sm">games lost</p>
					</div>
					<div className="col-span-2 flex justify-center p-1 rounded-lg">
						<h4 className="tracking-wide text-xs md:text-sm border-b-2 font-bold max-h-6
							landscape:self-center lg:landscape:self-start">RATING: {currentUser.stats.eloRating}</h4>
					</div>
				</div>
				<div className="flex flex-col gap-5 w-full flex-grow justify-center
					portrait:items-center lg:portrait:items-start
					portrait:text-center lg:portrait:text-left
					landscape:contents lg:landscape:flex">
					<h3 className="text-sm md:text-lg font-bold border-b-1
					portrait:w-fit lg:portrait:w-full
					landscape:hidden lg:landscape:block">settings</h3>
					<div className="flex flex-col px-2 gap-2 items-start
						portrait:items-center lg:portrait:items-start
						landscape:flex-row lg:landscape:flex-col
						landscape:justify-end lg:landscape:justify-start
						landscape:gap-5 lg:landscape:gap-2">
							{currentUser.friendshipStatus === "pending"
								? <button
									className="font-bold text-xs md:text-sm"
									disabled>
									friend request is pending</button>
								: <button
									className="font-bold text-xs md:text-sm"
									onClick={handleFriendClick}>
									{currentUser.isFriend ? "unfriend" : "befriend"}</button>
							}
							<button
								className="font-bold text-xs md:text-sm text-transcendence-red"
								onClick={handleBlockClick}>
								{currentUser.isBlockedByMe ? "unblock" : "block"}</button>
					</div>
				</div>
			</div>
		</div>
	)
}