import { ChatProfilePic } from "./ChatProfilePic";

type Friend = {
	username: string;
	profile: string;
	online: boolean;
	lastMessage?: string;
};

const Friends: Friend[] = [
	{
		username: "Aina",
		profile: "/profiles/aina",
		online: true,
		lastMessage: "Let's play!"
	},
	{
		username: "Anna",
		profile: "",
		online: false,
		lastMessage: "Let's play later!"
	}
];

type ChatProps = {
	onChatClick: () => void;
	onProfileClick: () => void;
};


export const Chat = ({onChatClick, onProfileClick}: ChatProps) => {
	//TODO: I need to get a list from backend of all the players friends and their username, profile, online, lastmessage (should include WHO sent the last message)...
	return (
		<div className="flex flex-col px-4">
			<ul className="flex flex-col">
				{Friends.map((friend) => (
					<li key={friend.username} className="border-b-2">
						<div className="flex flex-row gap-3 py-2 text-left">
							<ChatProfilePic friend={friend} onProfileClick={onProfileClick}/>
							<button className="flex flex-col gap-1" onClick={onChatClick}>
								<h3 className="font-semibold text-md text-left">{friend.username}</h3>
								<p className="text-xs">Julia: {friend.lastMessage}</p>
							</button>
						</div>
					</li>
				))}

			</ul>
		</div>
	);
}