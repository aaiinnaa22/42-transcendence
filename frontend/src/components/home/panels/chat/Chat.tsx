import { ChatProfilePic } from "./ChatProfilePic";
import type { ChatUser } from "./ChatContainer";

type ChatProps = {
  users: ChatUser[];
  selectedUserId: string | null;
  onChatClick: (user: ChatUser) => void;
  onProfileClick: (user: ChatUser) => void;
};

export const Chat = ({ users, selectedUserId, onChatClick, onProfileClick }: ChatProps) => {
  return (
    <div className="flex flex-col h-full bg-transcendence-white lg:rounded-l-2xl lg:border-2 py-6 lg:py-4 gap-4">
		<div className="flex justify-center lg:block">
			<div className="bg-transcendence-beige border-2 rounded-full w-60 lg:w-64 lg:rounded-none lg:rounded-r-full lg:border-l-0">
				<h2 className="lg:text-right text-center px-4 font-bold font-transcendence-three py-2 text-lg tracking-[0.06em]">chat with players</h2>
			</div>
		</div>
		<ul className="flex flex-col overflow-y-auto">
			{users.map((user) => {
			const isSelected = user.id === selectedUserId;
			return (
				<li key={user.id} className="border-b-1 border-transcendence-beige px-3">
					<div className="flex flex-row gap-3 py-3">
						<ChatProfilePic friend={user} onProfileClick={onProfileClick}/>
						<button onClick={() => onChatClick(user)} className="flex flex-col gap-1 text-left">
							<h3 className="font-semibold text-md truncate font-transcendence-two">
								{user.username}
							</h3>
							{user.lastMessage && (
								<p className="text-xs font-transcendence-two text-gray-500 truncate">
								{user.lastMessage}
								</p>
							)}
						</button>
				</div>
				</li>
			);
			})}
		</ul>
    </div>
  );
};
