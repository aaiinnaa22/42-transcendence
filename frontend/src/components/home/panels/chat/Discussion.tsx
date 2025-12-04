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
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

	const wsRef = useRef<WebSocket | null>(null);
	const myUserIdRef = useRef<number | null>(null);

	const friend: Friend = {username: "Susan", profile:"bla", online:true};

	useEffect(() => {
		const ws = new WebSocket("ws://localhost:4241/chat");
		wsRef.current = ws;

		ws.onopen = () => {
			console.log("WS connected");
		};

		ws.onmessage = (event) => {
			let data;
			try {
				data = JSON.parse(event.data);
			} catch (e) {
				console.error("Failed to parse WS message", e);
				return;
			}

			// Handle the welcome message (get my userId)
			if (data.type === "welcome") {
				myUserIdRef.current = data.userId;
				console.log("My userId:", data.userId);
				return;
			}

			// Handle chat messages
			if (data.type === "chat") {
				const sender: "me" | "friend" =
					data.from === myUserIdRef.current ? "me" : "friend";

				const newMessage: Message = {
					id: Date.now(),
					text: data.message,
					sender
				};

				setMessages(prev => [...prev, newMessage]);
			}
		};

		ws.onclose = () => {
			console.log("WS disconnected");
			wsRef.current = null;
		};

		ws.onerror = (err) => {
			console.error("WS error", err);
		};

		// Cleanup on unmount
		return () => {
			ws.close();
		};
	}, []);

	useEffect(() => {
		discussionEndRef.current?.scrollIntoView({behavior: "smooth"});
	},[messages]);

	const handleMessageSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim() === "")
			return;

		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			console.warn("WebSocket not connected");
			return;
		}

		wsRef.current.send(JSON.stringify({
			type: "chat",
			message
		}));

		setMessage("");
		if (textAreaRef.current)
			textAreaRef.current.style.height = "auto";
	};

	const handleMessageInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		e.target.style.height = "auto";
		e.target.style.height = `${Math.min(e.target.scrollHeight, 5 * 24)}px`; // 24px ≈ line-height
		setMessage(e.target.value);
	};
	
	return (
		<div className="flex flex-col h-full">

			{/* Header */}
			<div className="flex flex-row justify-between items-center bg-white w-full rounded-tl-xl p-2 border-b-2">
				<button onClick={onExitClick} className="material-symbols-outlined !text-md">arrow_back_ios_new</button>
				<h2 className="font-semibold">{friend.username}</h2>
				<ChatProfilePic friend={friend}/>
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
				<form onSubmit={handleMessageSubmit} className="flex gap-2 w-full">
				<div className="bg-white rounded-lg border min-h-8 max-h-40 overflow-y-auto">
					<textarea
					ref={textAreaRef}
					value={message}
					onChange={handleMessageInput}
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