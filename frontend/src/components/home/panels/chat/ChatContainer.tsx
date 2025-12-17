import { useEffect, useRef, useState } from "react";
import { Chat } from "./Chat";
import { Discussion } from "./Discussion";
import { forceLogout } from "../../../../api/forceLogout";
import { fetchWithAuth } from "../../../../api/fetchWithAuth";

export type Message = {
  id: number;
  text: string;
  sender: "me" | "friend";
  isInvite?: boolean;
};

export type ChatUser = {
  id: string;
  username: string;
  profile: string;
  online?: boolean;
  lastMessage?: string;
};

export const ChatContainer = () => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messagesByUser, setMessagesByUser] = useState<Record<string, Message[]>>(
    {}
  );

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

	const [inviteActive, setInviteActive] = useState(false);
	const [inviteTimeLeft, setInviteTimeLeft] = useState(0);
	const inviteStartTimeRef = useRef<number | null>(null);

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


  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchWithAuth("http://localhost:4241/chat/users", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(setUsers)
      .catch(err => console.error("Failed to load users", err));
  }, []);


  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4241/chat");
    wsRef.current = ws;


    ws.onopen = () => {
      console.log("Chat WS connected");
    };

    ws.onmessage = (e) => {
    	let data;
    	try {
    		data = JSON.parse(e.data);
    	} catch {
    	return;
    	}
		//attempt to auth socket requests
		if (data.type === "error" && data.reason === "unauthorized") {
			console.warn("WebSocket unauthorized, forcing logout");
			forceLogout();
			return;
		}

    	if (data.type === "dm") {
        	const fromId = data.from as string;
        	const messageText = data.message as string;

        	const newMessage: Message = {
          		id: Date.now(),
          		text: messageText,
          		sender: "friend",
        	};

        setMessagesByUser(prev => ({
        	...prev,
        	[fromId]: [...(prev[fromId] ?? []), newMessage],
        }));

        setUsers(prev =>
        	prev.map(u =>
        	u.id === fromId ? { ...u, lastMessage: messageText } : u
        	)
        );
    	}

		if (data.type === "invite") {
			const fromId = data.from as string;
			const inviteStartTimeStamp = data.timestamp;
			startInviteTimer(inviteStartTimeStamp);
			const newMessage: Message = {
				id: Date.now(),
				text: "I invite you to play a game with me!",
				sender: "friend",
				isInvite: true,
				}

			setMessagesByUser(prev => ({
        		...prev,
        		[fromId]: [...(prev[fromId] ?? []), newMessage],
        	}));
		}

		if (data.type === "presence:list") {
		setOnlineUserIds(new Set<string>(data.users));
		}

		if (data.type === "presence") {
		setOnlineUserIds(prev => {
			const next = new Set(prev);
			if (data.online) next.add(data.userId);
			else next.delete(data.userId);
			return next;
		});
		}

		if (data.type === "error" && data.reason === "blocked") {
			alert("You cannot message this user.");
		}

		if (data.type === "error") {
			console.error("Error received from server:", data.reason);
		}
    };

    ws.onclose = e => {
    	console.log("Chat WS disconnected");
		if (e.code === 1008)
			forceLogout();
    	wsRef.current = null;
    };

    return () => ws.close();
  }, []);


  const sendMessage = (text: string) => {
    if (!selectedUser) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: "dm",
        to: selectedUser.id,
        message: text,
      })
    );

    const myMessage: Message = {
      id: Date.now(),
      text,
      sender: "me",
    };

    setMessagesByUser(prev => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] ?? []), myMessage],
    }));

    setUsers(prev =>
      prev.map(u =>
        u.id === selectedUser.id ? { ...u, lastMessage: text } : u
      )
    );
  };
	const usersWithPresence: ChatUser[] = users.map(u => ({
	...u,
	online: onlineUserIds.has(u.id),
	}));

	const sendGameInvite = () =>
	{
		if (!selectedUser) return;
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
		const timestamp = Date.now();

		wsRef.current.send(JSON.stringify({
			type: "invite",
			to: selectedUser.id,
			message: "I invite you to play a game with me!",
			timestamp
		}));

		startInviteTimer(timestamp);

		const myMessage: Message = {
			id: Date.now(),
			text: "I invite you to play a game with me!",
			sender: "me",
			isInvite: true
		}

		setMessagesByUser(prev => ({
     		 ...prev,
      		[selectedUser.id]: [...(prev[selectedUser.id] ?? []), myMessage],
    	}));

		setUsers(prev =>
			prev.map(u =>
				u.id === selectedUser.id ? { ...u, lastMessage: "I invite you ..." } : u
      ));
	}

  return (
	<div className="h-full">

		{/* this renders user list */}
		{!selectedUser && (
		<Chat
			users={usersWithPresence}
			selectedUserId={null}
			onChatClick={setSelectedUser}
		/>
		)}

		{/* this renders chat window */}
		{selectedUser && (
		<Discussion
			friend={selectedUser}
			messages={messagesByUser[selectedUser.id] ?? []}
			onSendMessage={sendMessage}
			onExitClick={() => setSelectedUser(null)}
			inviteIsActive={inviteActive}
			inviteTimeLeft={inviteTimeLeft}
			onSendInvite={sendGameInvite}
		/>
		)}

	</div>
	);
};
