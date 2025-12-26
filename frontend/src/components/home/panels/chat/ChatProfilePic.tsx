import type { ChatUser } from "./ChatContainer";

type ChatProfileProps = {
	friend: ChatUser;
	onProfileClick: (user: ChatUser) => void;
}

export const ChatProfilePic = ({friend, onProfileClick}: ChatProfileProps) =>
{
	return (
		<div className="relative inline-block h-14 w-14 cursor-pointer"
			onClick={() => onProfileClick(friend)}>
			<img className="ml-1 mt-1 w-12 h-12 rounded-full object-cover" src={friend.profile}></img>
			<div className={"absolute top-1 left-1 border-[1.5px] rounded-full w-3 h-3 " + (friend.online ? "bg-transcendence-green" : "bg-transcendence-red")}></div>
		</div>
	);
}