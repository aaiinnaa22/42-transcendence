import { ChatProfilePic } from "./ChatProfilePic";
import type { ChatUser } from "./ChatContainer";

type ChatProps = {
  users: ChatUser[];
  selectedUserId: string | null;
  onChatClick: (user: ChatUser) => void;
};

export const Chat = ({ users, selectedUserId, onChatClick }: ChatProps) => {
  return (
    <div className="flex flex-col px-4">
      <ul className="flex flex-col">
        {users.map((user) => {
          const isSelected = user.id === selectedUserId;
          return (
            <li key={user.id} className="border-b-2">
              <button
                onClick={() => onChatClick(user)}
                className={
                  "flex flex-row gap-3 py-2 text-left cursor-pointer w-full " +
                  (isSelected ? "bg-gray-100" : "hover:bg-gray-50")
                }
				>
				<ChatProfilePic friend={user} />
				<div className="flex flex-col gap-1">
				<h3 className="font-semibold text-md truncate">
					{user.username}
				</h3>

				{user.lastMessage && (
					<p className="text-xs text-gray-500 truncate">
					{user.lastMessage}
					</p>
				)}
				</div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
