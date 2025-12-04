import { ChatProfilePic } from "./ChatProfilePic";
import { useState, useRef, useEffect } from "react";
import type { ChatUser } from "./ChatContainer";
import type { Message } from "./ChatContainer";

type DiscussionProps = {
	friend: ChatUser;
	messages: Message[];
	onSendMessage: (text: string) => void;
	onExitClick: () => void;
};

export const Discussion = ({
  friend,
  messages,
  onSendMessage,
  onExitClick,
}: DiscussionProps) => {
  const [message, setMessage] = useState("");
  const discussionEndRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    discussionEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage("");

    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
    }
  };

  const handleMessageInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 5 * 24)}px`;
    setMessage(e.target.value);
  };

  return (
    <div className="flex flex-col h-full">

      <div className="flex flex-row justify-between items-center bg-white w-full rounded-tl-xl p-2 border-b-2">
        <button onClick={onExitClick} className="material-symbols-outlined !text-md">
          arrow_back_ios_new
        </button>
        <h2 className="font-semibold">{friend.username}</h2>
        <ChatProfilePic friend={friend} />
      </div>

      <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-grow min-h-0">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={
              "p-3 rounded-lg max-w-[70%] bg-white " +
              (msg.sender === "me" ? "self-end" : "self-start")
            }
          >
            <p className="break-words">{msg.text}</p>
          </div>
        ))}
        <div ref={discussionEndRef} />
      </div>

      <div className="p-4">
        <form onSubmit={handleMessageSubmit} className="flex gap-2 w-full">
          <div className="bg-white rounded-lg border min-h-8 max-h-40 overflow-y-auto flex-1">
            <textarea
              ref={textAreaRef}
              value={message}
              onChange={handleMessageInput}
              placeholder={`Chat with ${friend.username}`}
              rows={1}
              className="focus:outline-none w-full resize-none p-2"
              disabled={!friend.online}
            />
          </div>
          <button
            type="submit"
            className="material-symbols-outlined self-end"
            disabled={!friend.online}
          >
            send
          </button>
        </form>
      </div>

    </div>
  );
};