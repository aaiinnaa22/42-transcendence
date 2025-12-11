type Friend = {
	username: string;
	profile: string;
	online?: boolean;
	lastMessage?: string;
}

type ChatProfileProps = {
	friend: Friend;
	onProfileClick: () => void;
}

export const ChatProfilePic = ({friend, onProfileClick}: ChatProfileProps) =>
{
	return (
		<div className="relative inline-block h-14 w-14 cursor-pointer"
			onClick={onProfileClick}>
			{friend.profile != ""
			? <img className="ml-1 mt-1 w-12 h-12 rounded-full object-cover" src="/testimage.png"></img>
			: <span className="!text-6xl material-symbols-outlined">account_circle</span>
			}
			<div className={"absolute top-1 left-1 border-[1.5px] rounded-full w-3 h-3 " + (friend.online ? "bg-purple-500" : "bg-white")}></div>
		</div>
	);
}