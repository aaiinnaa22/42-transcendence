import { ChatProfilePic } from "./ChatProfilePic";
import { useState, useRef, useEffect } from "react";

type Friend = {
	username: string;
	profile: string;
	online: boolean;
	lastMessage?: string;
}

type Message = {
	id: number;
	text: string;
	sender: "me" | "friend";
};

type DiscussionProps = {
	onExitClick: () => void;
}

export const Discussion = ({onExitClick}: DiscussionProps) =>
{
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const discussionEndRef = useRef<HTMLDivElement | null>(null);
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

	const friend: Friend = {username: "Susan", profile:"bla", online:true};

	useEffect(() => {
		discussionEndRef.current?.scrollIntoView({behavior: "smooth"});
	},[messages]);

	const handleMessageSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim() === "")
			return ;
		const newMessage: Message = {id: Date.now(), text: message, sender:"friend"};
		setMessages(prev => [...prev, newMessage]);
		setMessage("");
		if (textAreaRef.current)
			textAreaRef.current.style.height = "auto";
	};

	const handleMessageInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		e.target.style.height = "auto";
		e.target.style.height = `${Math.min(e.target.scrollHeight, 5 * 24)}px`; // 24px ≈ line-height
		setMessage(e.target.value);
	};

	const handleEnterKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleMessageSubmit(e as any); //as any?
		}
	}

	//idea for the game invite: in top corner a button to invite the friend. If click, an invitation will be sent as a message to the friend. If friend accepts, a text back
	//that says "friend accepted and joined the game room", and below a button to join it aswell

	return (
		<div className="flex flex-col h-full">

			{/* Header */}
			<div className="flex flex-row justify-between items-center bg-white w-full lg:rounded-tl-xl  p-2 border-b-2">
				<button onClick={onExitClick} className="material-symbols-outlined !text-md">arrow_back_ios_new</button>
				<h2 className="font-semibold">{friend.username}</h2>
				<ChatProfilePic friend={friend}/>
			</div>
			<div className="self-end p-3">
				<button className="px-3 flex flex-row items-center justify-between rounded-4xl gap-2 bg-transcendence-white border-2 cursor-pointer">
				<p className="text-sm">Invite {friend.username} to a game</p>
				<div className="!text-3xl material-symbols-outlined">
				sports_esports</div>
				</button>
			</div>

			{/* Messages */}
			<div className="flex flex-col gap-3 p-3 overflow-y-auto flex-grow min-h-0">
				{messages.map(msg => (
					<div
						key={msg.id}
						className={"p-3 rounded-lg  max-w-[70%] bg-white " + (msg.sender === "me" ? "self-end" : "self-start")}>
						<p className="break-words">{msg.text}</p>
					</div>
				))}
				<div ref={discussionEndRef}></div>
			</div>

			{/* Input bar */}
			<div className="p-4">
				<form onSubmit={handleMessageSubmit} className="flex gap-2 w-full justify-center">
				<div className="bg-white rounded-lg border min-h-8 max-h-40 overflow-y-auto w-[70%] xl:w-full">
					<textarea
					ref={textAreaRef}
					value={message}
					onChange={handleMessageInput}
					onKeyDown={handleEnterKey}
					placeholder="Chat with your friend"
					rows={1}
					className="focus:outline-none w-full resize-none p-2"
					/>
				</div>
				<button type="submit" className="material-symbols-outlined self-end">send</button>
				</form>
			</div>

		</div>
	);
}