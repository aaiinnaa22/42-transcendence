import { ChatProfilePic } from "./ChatProfilePic";
import { useState, useRef, useEffect } from "react";

type DiscussionProps = {
	onExitClick: () => void;
};

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

export const Discussion = ({onExitClick}: DiscussionProps) =>
{
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const discussionEndRef = useRef<HTMLDivElement | null>(null);

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
	};

	const handleMessageInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		e.target.style.height = "auto";
		e.target.style.height = `${Math.min(e.target.scrollHeight, 5 * 24)}px`; // 24px ≈ line-height
		setMessage(e.target.value);
	};

	return (
		<div className="flex flex-col justify-between h-full items-center">
			<div className="flex flex-col gap-4 w-full h-[90%] pb-4">
				<div className="flex flex-row justify-between items-center bg-white w-full rounded-tl-xl p-2 border-b-2">
					<button onClick={onExitClick} className="material-symbols-outlined !text-md">arrow_back_ios_new</button>
					<h2 className="font-semibold">{friend.username}</h2>
					<ChatProfilePic friend={friend}/>
				</div>
				<div className="w-full flex flex-col gap-3 p-3 overflow-y-auto">
				{messages.map(msg => (
					<div
						key={msg.id}
						className={"p-3 rounded-lg  max-w-[70%] bg-white " + (msg.sender === "me" ? "self-end" : "self-start")}>
						<p className="break-words">{msg.text}</p>
					</div>
				))}
				<div ref={discussionEndRef}></div>
			</div>
			</div>
			<div className="pb-7 px-5 flex justify-center">
					<form onSubmit={handleMessageSubmit} className="flex gap-2">
						<div className="bg-white min-h-8 rounded-lg border-[1.5px]">
							<textarea
								value={message}
								onChange={handleMessageInput}
								placeholder="Chat with your friend"
								rows={1}
								className="focus:outline-none h-auto max-h-40 min-h-8 resize-none pl-2 pr-4 py-1">
							</textarea>
						</div>
						<button type="submit" className="material-symbols-outlined self-end">send</button>
					</form>
			</div>
		</div>
	);
}