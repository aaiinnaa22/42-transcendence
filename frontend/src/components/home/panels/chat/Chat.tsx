import { ChatProfilePic } from "./ChatProfilePic";
import type { ChatUser } from "./ChatContainer";

type ChatProps = {
  users: ChatUser[];
  selectedUserId: string | null;
  onChatClick: (user: ChatUser) => void;
};

export const Chat = ({ users, selectedUserId, onChatClick }: ChatProps) => {
  return (
    <div className="flex flex-col px-4 h-full overflow-y-auto">
      <ul className="flex flex-col">
        {users.map((user) => {
          const isSelected = user.id === selectedUserId;

          return (
            <li key={user.id} className="border-b">
              <button
                onClick={() => onChatClick(user)}
                className={
                  "flex w-full flex-row gap-3 py-3 text-left cursor-pointer " +
                  (isSelected ? "bg-gray-100" : "hover:bg-gray-50")
                }
              >
                <ChatProfilePic friend={user} />

                <div className="flex flex-col gap-1 overflow-hidden">
                  <h3 className="font-semibold text-md truncate">
                    {user.username}
                  </h3>

                  {user.lastMessage && (
                    <p className="text-xs text-gray-500 truncate">
                      {user.lastMessage}
                    </p>
                  )}
                </div>

                {/* Online indicator */}
                <span
                  className={
                    "ml-auto mt-2 w-2 h-2 rounded-full " +
                    (user.online ? "bg-green-500" : "bg-gray-400")
                  }
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};