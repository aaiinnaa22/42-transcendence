import { useEffect, useRef, useState } from "react";
import { Chat } from "./Chat";
import { Discussion } from "./Discussion";

export type Message = {
  id: number;
  text: string;
  sender: "me" | "friend";
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


  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch("http://localhost:4241/chat/users", {
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
    };

    ws.onclose = () => {
    	console.log("Chat WS disconnected");
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
		/>
		)}

	</div>
	);
};
