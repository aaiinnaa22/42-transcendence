import { ChatProfilePic } from "./ChatProfilePic";
import { useState, useRef, useEffect } from "react";
import type { ChatUser, Message } from "./ChatContainer";
import { useNavigate } from "react-router-dom";

type DiscussionProps = {
  friend: ChatUser;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onExitClick: () => void;
  inviteIsActive: boolean;
  inviteTimeLeft: number;
  onSendInvite: () => void;
  onAcceptInvite: (userId: string) => void; 
};

export const Discussion = ({
  friend,
  messages,
  onSendMessage,
  onExitClick,
  inviteIsActive,
  inviteTimeLeft,
  onAcceptInvite,
  onSendInvite,
}: DiscussionProps) => {
  const [message, setMessage] = useState("");
  const discussionEndRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    discussionEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasReceivedInvite = messages.some(
    m => m.isInvite && m.sender === "friend" && !m.isExpired
  );

  const sendMessage = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage("");
    if (textAreaRef.current) textAreaRef.current.style.height = "auto";
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMessageInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 5 * 24)}px`;
    setMessage(e.target.value);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex flex-row justify-between items-center bg-white w-full lg:rounded-tl-xl p-2 border-b-2">
        <button
          onClick={onExitClick}
          className="material-symbols-outlined !text-xs lg:!text-md"
        >
          arrow_back_ios_new
        </button>
        <h2 className="font-semibold text-sm lg:text-md">
          {friend.username}
        </h2>
        <ChatProfilePic friend={friend} />
      </div>

      {/* Invite button */}
      <div className="self-end p-2">
        <button
          className="px-3 flex flex-row items-center justify-between rounded-4xl gap-2 bg-transcendence-white border-2 cursor-pointer"
          disabled={inviteIsActive}
          onClick={onSendInvite}
        >
          <p className="text-xs lg:text-sm text-left">
            {!inviteIsActive
              ? `Invite ${friend.username} to a game`
              : "Game invite pending"}
          </p>
          <div className="!text-xl lg:!text-3xl material-symbols-outlined">
            sports_esports
          </div>
        </button>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-grow min-h-0">
        {messages.map(msg => {
          if (!msg.isInvite) {
            return (
              <div
                key={msg.id}
                className={
                  "p-3 rounded-lg max-w-[70%] bg-white " +
                  (msg.sender === "me" ? "self-end" : "self-start")
                }
              >
                <p className="break-words text-xs lg:text-md">{msg.text}</p>
              </div>
            );
          }

          // 👇 INVITE MESSAGE (MULTIPLE BOXES)
          return (
            <div
              key={msg.id}
              className={
                "flex flex-col gap-3 p-3 rounded-lg max-w-[70%] bg-purple-600 " +
                (msg.sender === "me" ? "self-end" : "self-start")
              }
            >
              <p className="break-words text-transcendence-white">
                {msg.text}
              </p>

              <div className="flex flex-row justify-center items-center border-2 border-transcendence-white rounded-lg p-1 gap-2">
                {inviteIsActive && !msg.isExpired && (
                  <span className="text-transcendence-white font-bold">
                    {formatTime(inviteTimeLeft)}
                  </span>
                )}
                <button
                  disabled={!inviteIsActive || msg.isExpired }
                  className="text-white font-bold"
                  onClick={() => {
                    onAcceptInvite(friend.id);
                    navigate("/home/play/invite", {
                      state: { invitee: friend.username },
                    });
                  }}
                >
                  {inviteIsActive ? "Join the game" : "Invite expired"}
                </button>
              </div>
            </div>
          );
        })}
        <div ref={discussionEndRef} />
      </div>

      {/* Input */}
      <div className="p-4">
        <form
          onSubmit={handleFormSubmit}
          className="flex gap-2 w-full justify-center"
        >
          <div className="bg-white rounded-lg border min-h-8 max-h-40 overflow-y-auto w-[70%] xl:w-full text-xs lg:text-md">
            <textarea
              ref={textAreaRef}
              value={message}
              onChange={handleMessageInput}
              onKeyDown={handleKeyDown}
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
