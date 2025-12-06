type Friend = {
	username: string;
	profile: string;
	online?: boolean;
	lastMessage?: string;
}

type ChatProfileProps = {
	friend: Friend;
}

export const ChatProfilePic = ({friend}: ChatProfileProps) =>
{
	return (
		<div className="relative inline-block h-9 w-9 lg:h-12 lg:w-12">
			{friend.profile != ""
			? <img className="ml-1 mt-1 w-7 h-7 lg:w-10 lg:h-10 rounded-full object-cover" src="/testimage.png"></img>
			: <span className="!text-4xl lg:!text-5xl material-symbols-outlined">account_circle</span>
			}
			<div className={"absolute top-1 left-1 border-[1.5px] rounded-full w-2 h-2 lg:w-3 lg:h-3 " + (friend.online ? "bg-purple-500" : "bg-white")}></div>
		</div>
	);
}