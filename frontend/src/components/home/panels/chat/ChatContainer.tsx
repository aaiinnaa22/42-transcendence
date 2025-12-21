import { useEffect, useRef, useState } from "react";
import { Chat } from "./Chat";
import { Discussion } from "./Discussion";

export type Message = {
    id: number;
 	text: string;
	sender: "me" | "friend";

	type: "text" | "invite";

  // invite-specific
	invite?: {
    	startedAt: number;
    	expiresAt: number;
    	status: "pending" | "expired" | "joined";
  	};
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
  	const [messagesByUser, setMessagesByUser] = useState<Record<string, Message[]>>({});
	const [myUserId, setMyUserId] = useState<string | null>(null);
	const myUserIdRef = useRef<string | null>(null);
 	const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  	const [now, setNow] = useState(Date.now());
	const usersRef = useRef<ChatUser[]>([]);


  	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

  	useEffect(() => {
    	fetch("http://localhost:4241/chat/users", {
      	credentials: "include",
    })
      .then(res => res.json())
      .then(setUsers)
      .catch(err => console.error("Failed to load users", err));
  	}, []);

	useEffect(() => {
		usersRef.current = users;
	}, [users]);

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
				type: "text",
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

		if (data.type === "me") {
			myUserIdRef.current = data.userId;
			setMyUserId(data.userId);
			return;
		}

		if (data.type === "invite:joined") {
			const me = myUserIdRef.current;
			if (!me) return;

			const { from, to } = data;
			const otherUserId = from === me ? to : from;

			setMessagesByUser(prev => {
			const msgs = prev[otherUserId] ?? [];

			const idx = [...msgs]
			.map((m, i) => ({ m, i }))
			.filter(x => x.m.type === "invite" && x.m.invite?.status === "pending")
			.at(-1)?.i;

			if (idx === undefined) return prev;

			const updated = [...msgs];
			updated[idx] = {
			...updated[idx],
			invite: {
				...updated[idx].invite!,
				status: "joined",
			},
			};

			return {
			...prev,
			[otherUserId]: updated,
			};
		});
		}

		if (data.type === "invite:received") {
			const inviteMessage: Message = {
				id: Date.now(),
				sender: "friend",
				text: `${data.fromUsername ?? "Someone"} invited you to a game`,
				type: "invite",
				invite: {
				startedAt: data.startedAt,
				expiresAt: data.expiresAt,
				status: "pending",
				},
			};

			setMessagesByUser(prev => ({
				...prev,
				[data.from]: [...(prev[data.from] ?? []), inviteMessage],
			}));

			setUsers(prev =>
				prev.map(u =>
				u.id === data.from
					? { ...u, lastMessage: "Invited you to a game" }
					: u
				)
			);
		}

		if (data.type === "invite:sent") {
			const inviteMessage: Message = {
				id: Date.now(),
				sender: "me",
				text: `You invited ${data.toUsername ?? "this user"} to a game`,
				type: "invite",
				invite: {
				startedAt: data.startedAt,
				expiresAt: data.expiresAt,
				status: "pending",
				},
			};

			setMessagesByUser(prev => ({
				...prev,
				[data.to]: [...(prev[data.to] ?? []), inviteMessage],
			}));

			setUsers(prev =>
				prev.map(u =>
				u.id === data.to
					? { ...u, lastMessage: "You invited them to a game" }
					: u
				)
			);
		}
		  

		if (data.type === "invite:expired") {
   			const me = myUserIdRef.current;
			if (!me) return;

  			const [a, b] = data.users;
  			const otherUserId = a === me ? b : a;
			
			//show info about expired invite
			setUsers(prev =>
				prev.map(u =>
				  u.id === otherUserId
					? { ...u, lastMessage: "Game invite expired" }
					: u
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

		if (data.type === "error" && data.reason === "blocked") {
			alert("You cannot message this user.");
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
	  type: "text",
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

	const acceptAndJoinInvite = (userId: string, inviteId: number) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
		
		   setMessagesByUser(prev => ({
		 	...prev,
		 	[userId]: (prev[userId] ?? []).map(m =>
		 	m.id === inviteId
		 		? {
		 			...m,
		 			invite: { ...m.invite!, status: "joined" },
		 		}
		 		: m
		 	),
		}));
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({
			  type: "invite:joined",
			  to: userId,
			}));
		}
	};

	const sendGameInvite = () => {
		if (!selectedUser) return;
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
	  
		wsRef.current.send(JSON.stringify({
		  type: "invite",
		  to: selectedUser.id,
		}));
	};

  	const usersWithPresence = users.map(u => ({
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
				onSendInvite={sendGameInvite}
				onAcceptInvite={(inviteId) => acceptAndJoinInvite(selectedUser.id, inviteId)}
			/>
			)}
		</div>
	);
};