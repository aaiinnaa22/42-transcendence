import { useEffect, useRef, useState } from "react";
import { Chat } from "./Chat";
import { Discussion } from "./Discussion";

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

type InviteState = {
  startedAt: number;
  expiresAt: number;
  status: "pending" | "joined" | "declined";
};

export const ChatContainer = () => {
  	const [users, setUsers] = useState<ChatUser[]>([]);
  	const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  	const [messagesByUser, setMessagesByUser] = useState<Record<string, Message[]>>({});
	const [myUserId, setMyUserId] = useState<string | null>(null);
	const myUserIdRef = useRef<string | null>(null);
 	const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  	const [invitesByUser, setInvitesByUser] = useState<Record<string, InviteState | null>>({});
  	const [now, setNow] = useState(Date.now());

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

		if (data.type === "me") {
			myUserIdRef.current = data.userId;
			setMyUserId(data.userId);
			return;
		}

		if (data.type === "invite") {
			console.log("invite received. me=", myUserIdRef.current, "from=", data.from, "to=", data.to);
			const me = myUserIdRef.current;
			if (!me) return;
			if (data.from === me) return;

			const fromId = data.from as string;
			const { startedAt, expiresAt } = data;
			const otherUserId = fromId === me ? data.to : fromId;

			setInvitesByUser(prev => ({
				...prev,
				[otherUserId]: { startedAt, expiresAt, status: "pending", },
			}));

			const inviteMessage: Message = {
				id: Date.now(),
				text: "I invite you to play a game with me!",
				sender: fromId === me ? "me" : "friend",
				isInvite: true,
				}

			setMessagesByUser(prev => ({
			...prev,
			[otherUserId]: [...(prev[otherUserId] ?? []), inviteMessage],
			}));
		}

		if (data.type === "invite:joined") {
			const me = myUserIdRef.current;
			if (!me) return;

			const { from, to } = data;
			const otherUserId = from === me ? to : from;

			setInvitesByUser(prev => ({
				...prev,
				[otherUserId]: prev[otherUserId]
				? { ...prev[otherUserId]!, status: "joined" }
				: null,
			}));
		}

		if (data.type === "invite:expired") {
   			const me = myUserIdRef.current;
			if (!me) return;

  			const [a, b] = data.users;
  			const otherUserId = a === me ? b : a;
			setInvitesByUser(prev => ({ ...prev, [otherUserId]: null }));
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

	const sendGameInvite = () => {
    if (!selectedUser || !wsRef.current) return;
	const startedAt = Date.now();
  	const expiresAt = startedAt + 120_000;
  	setInvitesByUser(prev => ({
		...prev,
		[selectedUser.id]: { startedAt, expiresAt, status: "pending", },
	}));

    wsRef.current.send(JSON.stringify({
      type: "invite",
      to: selectedUser.id,
    }));

    setMessagesByUser(prev => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] ?? []), {
        id: Date.now(),
        text: "I invite you to play a game with me!",
        sender: "me",
        isInvite: true,
    	}],
    	}));
  	};

	const acceptAndJoinInvite = (userId: string) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;


		setInvitesByUser(prev => ({
			...prev,
			[userId]: prev[userId]
			? { ...prev[userId]!, status: "joined" }
			: null,
		}));

		// 2️⃣ notify server
		wsRef.current.send(JSON.stringify({
			type: "invite:joined",
			to: userId,
		}));
	};

	const clearInvite = (userId: string) => {
		setInvitesByUser(prev => ({
			...prev,
			[userId]: null,
		}));
	};

	/* -------- derived invite state -------- */
	const invite = selectedUser ? invitesByUser[selectedUser.id] : null;
	const inviteTimeLeft = invite && invite.status === "pending"
		? Math.max(0, Math.floor((invite.expiresAt - now) / 1000))
		: 0;

  	const inviteIsActive = invite?.status === "pending" && inviteTimeLeft > 0;

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
				inviteIsActive={inviteIsActive}
				inviteTimeLeft={inviteTimeLeft}
				onSendInvite={sendGameInvite}
				onAcceptInvite={() => acceptAndJoinInvite(selectedUser.id)}
				inviteStatus={invite?.status}
			/>
			)}

		</div>
	);
};