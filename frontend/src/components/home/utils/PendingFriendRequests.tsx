import { useTranslation } from "react-i18next";
import { fetchPendingFriendRequests, useAcceptFriendRequest } from "../../../BackendFetch"
import { useEffect, useState } from "react"

type PendingListItem = {
	requestId: string;
	fromUserId: string;
	fromUsername: string;
	fromAvatar: string;
};

export const PendingFriendRequests = () =>
{
	const [currentList, setCurrentList] = useState<PendingListItem[]>([]);
	const {acceptFriendRequest, rejectFriendRequest} = useAcceptFriendRequest();

	const {t} = useTranslation();

	const getPendingRequests = async () => {
		const listOfPending = await fetchPendingFriendRequests();
		if (listOfPending)
			setCurrentList(listOfPending);
	};

	const handleRejectClick = async (fromUserId: string) => {
		const ok = await rejectFriendRequest(fromUserId); //fromUserId
		if (ok)
			await getPendingRequests();
	}

	const handleAcceptClick = async (fromUserId: string) => {
		const ok = await acceptFriendRequest(fromUserId); //fromUserId
		if (ok)
			await getPendingRequests();
	}

	useEffect(() => {
		getPendingRequests();
	}, []);

	return (
		<div className="flex flex-col items-center gap-4 bg-transcendence-white w-full h-full rounded-lg p-2">
			<div className="bg-transcendence-beige p-2 rounded-full border-2">
				<h2 className="font-transcendence-three text-md font-bold tracking-wider">
					{t("friend.requests")}
				</h2>
			</div>
			{currentList.length === 0
				? (<p className="font-transcendence-two text-center text-xs text-gray-300 ">
						{t("friend.noPending")}
					</p>)
				: (
					<ul className="flex flex-col w-full overflow-y-auto">
						{currentList.map((item) => (
							<li
								key={item.requestId}
								className="border-b-1 border-transcendence-beige px-3">
								<div className="flex flex-row justify-between items-center">
									<div className="flex flex-row gap-3">
										<img
											src={item.fromAvatar}
											className="w-5 h-5 rounded-full object-cover border-1"/>
										<span className="font-transcendence-two text-sm">
											{item.fromUsername}
										</span>
									</div>
									<div>
										<button
											className="material-symbols-outlined !text-md text-transcendence-green cursor-pointer"
											onClick={() => handleAcceptClick(item.fromUserId)}>check_small</button>
										<button
											className="material-symbols-outlined !text-md text-transcendence-red cursor-pointer"
											onClick={() => handleRejectClick(item.fromUserId)}>close_small</button>
									</div>
								</div>
							</li>
						))}

					</ul>
				)}
		</div>
	)
}
