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
	isInvite?: boolean;
};

export const Discussion = ({onExitClick}: DiscussionProps) =>
{
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const discussionEndRef = useRef<HTMLDivElement | null>(null);
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

	const [inviteActive, setInviteActive] = useState(false);
	const [inviteTimeLeft, setInviteTimeLeft] = useState(0);
	const inviteStartTimeRef = useRef<number | null>(null);

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	};

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

			//handle game invitation
			if (data.type === "invite") {
				const sender: "me" | "friend" =
					data.from === myUserIdRef.current ? "me" : "friend";
				const inviteStartTimeStamp = data.timestamp;
				startInviteTimer(inviteStartTimeStamp);
				const newMessage: Message = {
					id: Date.now(),
					text: "I invite you to play a game with me!",
					sender,
					isInvite: true,
				}

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

	function startInviteTimer(inviteStartTimestamp: number) {
		inviteStartTimeRef.current = inviteStartTimestamp;
		setInviteActive(true);

		const countdown = () => {
			const now = Date.now();
			const diff = Math.floor((inviteStartTimestamp + 120000 - now) / 1000); // 2 min = 120000 ms
			if (diff <= 0) {
				setInviteActive(false);
				setInviteTimeLeft(0);
				clearInterval(timerId);
			} else {
				setInviteTimeLeft(diff);
			}
		};

		countdown(); // run immediately

		const timerId = setInterval(countdown, 1000);
	}

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

	const sendGameInvite = () =>
	{
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			console.warn("WebSocket not connected");
			return;
		}
		const timestamp = Date.now();

		wsRef.current.send(JSON.stringify({
			type: "invite",
			timestamp
		}));

		startInviteTimer(timestamp);

		setMessages(prev => [
			...prev,
			{
				id: Date.now(),
				text: "I invite you to play a game with me!",
				sender: "me",
				isInvite: true
			}
		]);
	}


	return (
		<div className="flex flex-col h-full">

			{/* Header */}
			<div className="flex flex-row justify-between items-center bg-white w-full rounded-tl-xl p-2 border-b-2">
				<button onClick={onExitClick} className="material-symbols-outlined !text-md">arrow_back_ios_new</button>
				<h2 className="font-semibold">{friend.username}</h2>
				<ChatProfilePic friend={friend}/>
			</div>
			{/*game invite*/}
			<div className="self-end p-3">
				<button className="px-2 flex flex-row items-center justify-between rounded-4xl gap-2 bg-transcendence-white border-2 cursor-pointer"
					disabled={inviteActive} onClick={sendGameInvite}>
				<p className="text-sm text-left">{!inviteActive ? `Invite ${friend.username} to a game` : "You have a pending game invite"}</p>
				<div className="!text-3xl material-symbols-outlined">
				sports_esports</div>
				</button>
			</div>

			{/* Messages */}
			<div className="flex flex-col gap-3 p-3 overflow-y-auto flex-grow min-h-0">
				{messages.map(msg => {
					if (!msg.isInvite) {
						return (
							<div
								key={msg.id}
								className={"p-3 rounded-lg  max-w-[70%] bg-white " + (msg.sender === "me" ? "self-end" : "self-start")}>
								<p className="break-words">{msg.text}</p>
							</div>
						)
					}
					return (
						<div
							key={msg.id}
							className={"flex flex-col gap-3 p-3 rounded-lg  max-w-[70%] bg-purple-600 " + (msg.sender === "me" ? "self-end" : "self-start")}>
							<p className="break-words text-transcendence-white">{msg.text}</p>
							<div className="flex flex-row justify-center items-center border-2 border-transcendence-white rounded-lg p-1 gap-2">
								{inviteActive && <span className="text-transcendence-white font-bold">{formatTime(inviteTimeLeft)}</span>}
								<button disabled={!inviteActive} className="text-white font-bold">{inviteActive ? "join the game" : "invite expired"}</button>
							</div>
						</div>
				)})}
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