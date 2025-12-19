import { ChatProfilePic } from "./ChatProfilePic";
import { useState, useRef, useEffect } from "react";
import type { ChatUser } from "./ChatContainer";
import type { Message } from "./ChatContainer";
import { useNavigate } from "react-router-dom";

type DiscussionProps = {
	friend: ChatUser;
	messages: Message[];
	onSendMessage: (text: string) => void;
	onExitClick: () => void;
	onProfileClick: (user: ChatUser) => void;
	inviteIsActive: boolean;
	inviteTimeLeft: number;
	onSendInvite: () => void;
};

export const Discussion = ({
  friend,
  messages,
  onSendMessage,
  onExitClick,
  inviteIsActive,
  inviteTimeLeft,
  onSendInvite,
  onProfileClick
}: DiscussionProps) => {
	const [message, setMessage] = useState("");
	const discussionEndRef = useRef<HTMLDivElement | null>(null);
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		discussionEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}, [messages]);


	const sendMessage = () => {
		if (!message.trim()) return;

		onSendMessage(message);
		setMessage("");

		if (textAreaRef.current)
				textAreaRef.current.style.height = "auto";
	}

	const handleMessageSubmit = (e: React.FormEvent | React.KeyboardEvent<HTMLTextAreaElement>) => {
		if ("key" in e) {
			if (e.key === 'Enter' && !e.shiftKey)
			{
				e.preventDefault();
				sendMessage();
			}
		}
		else
		{
			e.preventDefault();
			sendMessage();
		}
	};

	const handleMessageInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		e.target.style.height = "auto";
		e.target.style.height = `${Math.min(e.target.scrollHeight, 5 * 24)}px`; // 24px ≈ line-height
		setMessage(e.target.value);
	};

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="flex flex-col h-full lg:rounded-l-2xl lg:border-2">

			{/* Header */}
			<div className="flex flex-row justify-between items-center bg-white w-full lg:rounded-tl-2xl p-2 border-b-2">
				<button onClick={onExitClick} className="material-symbols-outlined !text-md">arrow_back_ios_new</button>
				<h2 className="font-semibold">{friend.username}</h2>
				<ChatProfilePic friend={friend} onProfileClick={onProfileClick}/>
			</div>
			<div className="self-end p-2">
				<button className="px-3 flex flex-row items-center justify-between rounded-4xl gap-2 bg-transcendence-white border-2 cursor-pointer"
					disabled={inviteIsActive} onClick={onSendInvite}>
				<p className="text-xs text-left">{!inviteIsActive ? `Invite ${friend.username} to a game` : "You have a pending game invite"}</p>
				<div className="!text-xl lg:!text-3xl material-symbols-outlined">
				sports_esports</div>
				</button>
			</div>

			{/* Messages */}
			<div className="flex flex-col gap-3 p-3 overflow-y-auto flex-grow min-h-0">
				{messages.map(msg => {
					if (!msg.isInvite)
						return (
							<div
								key={msg.id}
								className={"p-3 rounded-lg  max-w-[70%] bg-white " + (msg.sender === "me" ? "self-end" : "self-start")}>
								<p className="break-words text-xs lg:text-md">{msg.text}</p>
							</div>
						)
					return (
						<div
							key={msg.id}
							className={"flex flex-col gap-3 p-3 rounded-lg  max-w-[70%] bg-purple-600 " + (msg.sender === "me" ? "self-end" : "self-start")}>
							<p className="break-words text-transcendence-white">{msg.text}</p>
							<div className="flex flex-row justify-center items-center border-2 border-transcendence-white rounded-lg p-1 gap-2">
								{inviteIsActive && <span className="text-transcendence-white font-bold">{formatTime(inviteTimeLeft)}</span>}
								<button disabled={!inviteIsActive} className="text-white font-bold"
									onClick={() => navigate("/home/play/invite", { state: {invitee: friend.username}})}>{inviteIsActive ? "join the game" : "invite expired"}</button>
							</div>
						</div>
					)
				})}
				<div ref={discussionEndRef}></div>
			</div>

			{/* Input bar */}
			<div className="p-4">
				<form onSubmit={handleMessageSubmit} className="flex gap-2 w-full justify-center">
				<div className="bg-white rounded-lg border min-h-8 max-h-40 overflow-y-auto w-[70%] xl:w-full text-xs lg:text-md">
					<textarea
					ref={textAreaRef}
					value={message}
					onChange={handleMessageInput}
					onKeyDown={handleMessageSubmit}
					placeholder={`Chat with ${friend.username}`} //placeholder changes when friend isnt online and u cant chat?
					rows={1}
					className="focus:outline-none w-full resize-none p-2"
					disabled={!friend.online}
					/>
				</div>
				<button type="submit" className="material-symbols-outlined self-end"
					disabled={!friend.online}>send</button>
				</form>
			</div>

    </div>
  );
};