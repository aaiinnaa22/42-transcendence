import { useEffect, useRef, useState } from "react";
import { Chat } from "./Chat";
import { Discussion } from "./Discussion";
import { apiUrl, wsUrl } from "../../../../api/api";
import { ChatProfile } from "./ChatProfile";
import { forceLogout } from "../../../../api/forceLogout";
import { fetchWithAuth } from "../../../../api/fetchWithAuth";
import { SideTab } from "../../utils/SideTab";
import { PopUp } from "../../utils/PopUp";
import { useTranslation } from "react-i18next";

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

type userStats = {
	wins:  number,
	losses: number,
	playedGames: number,
	eloRating: number
}

export type ChatUser = {
	id: string;
	username: string;
	profile: string;
	online?: boolean;
	lastMessage?: string;
	stats: userStats;
	isFriend: boolean;
	isBlockedByMe: boolean;
	hasBlockedMe: boolean;
	friendshipStatus?: "pending" | "accepted";
};

type ChatContainerProps = {
	chatIsOpen: boolean;
};

export const ChatContainer = ({ chatIsOpen }: ChatContainerProps) => {
  	const [users, setUsers] = useState<ChatUser[]>([]);
  	const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  	const [messagesByUser, setMessagesByUser] = useState<Record<string, Message[]>>({});
	const myUserIdRef = useRef<string | null>(null);
 	const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
	const [profileUser, setProfileUser] = useState<ChatUser | null>(null);
	const [inviteDisabledUntil, setInviteDisabledUntil] = useState<number | null>(null);


  	const wsRef = useRef<WebSocket | null>(null);
	const usersRef = useRef<ChatUser[]>([]);

	const {t} = useTranslation();

	const isInviteDisabled =
	inviteDisabledUntil !== null && Date.now() < inviteDisabledUntil;

	useEffect(() => {
		fetchWithAuth( apiUrl('/chat/users') )
			.then(res => res.json())
			.then(setUsers)
			.catch(err => console.error("Failed to load users", err));
  	}, []);

	useEffect(() => {
		usersRef.current = users;
	}, [users]);

	useEffect(() => {
		const id = setInterval(() => {
			setMessagesByUser( prev =>
			{
				let changed = false;
				const next: Record<string, Message[]> = {};

				for ( const userId in prev )
				{
					const messages = prev[userId] ?? [];
					next[userId] = messages.map( m =>
					{
						if ( m.type === "invite"
							&& m.invite?.status === "pending"
							&& m.invite.expiresAt <= Date.now() )
						{
							changed = true;
								return {
								...m,
								invite: { ...m.invite, status: "expired" },
							};
						}
						return m;
					});
				}
				return changed ? next : prev;
			});
		}, 1000);

		return () => clearInterval(id);
	}, []);

  	useEffect(() => {
		const ws = new WebSocket( wsUrl("/chat") );
		wsRef.current = ws;

		ws.onopen = () => {
			console.log("Chat WS connected");
		};

		ws.onmessage = (e) => {
			let data;
			try
			{
				data = JSON.parse(e.data);
			}
			catch
			{
				return;
			}

			// attempt to auth socket requests
			if (data.type === "error" && data.reason === "unauthorized")
			{
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

				if ( idx === undefined ) return prev;

				const updated = [...msgs];
				const existing = updated[idx];
				if ( !existing ) return prev;

				updated[idx] = {
					...existing,
					invite: {
						...existing.invite!,
						status: "joined",
					},
				} as Message;

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
					text: t("chat.invite.received"),
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
						? { ...u, lastMessage: t("chat.invite.received") }
						: u
					)
				);
			}

			if (data.type === "invite:sent") {
				const inviteMessage: Message = {
					id: Date.now(),
					sender: "me",
					text: t("chat.invite.sent"),
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
						? { ...u, lastMessage: t("chat.invite.sent") }
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
						? { ...u, lastMessage: t("chat.invite.expired") }
						: u
					)
				);

				setMessagesByUser(prev => {
					const msgs = prev[otherUserId] ?? [];
					const lastPendingIndex = [...msgs]
						.map((m, i) => ({ m, i }))
						.filter(x => x.m.type === "invite" && x.m.invite?.status === "pending")
						.at(-1)?.i;

					if ( lastPendingIndex === undefined ) return prev;

					const updated = [...msgs];
					const existing = updated[lastPendingIndex];
					if ( !existing ) return prev;

					updated[lastPendingIndex] = {
						...existing,
						invite: {
							...existing.invite!,
							status: "expired",
						},
					} as Message;
					setInviteDisabledUntil(null);
					return { ...prev, [otherUserId]: updated };
				});
			}

			if (data.type === "invite:rejected") {
				// disable invite button for 1 minute (or server-provided value)
				const retryAfter =
					typeof data.retryAfterMs === "number"
						? data.retryAfterMs
						: 60_000;
			
				setInviteDisabledUntil(Date.now() + retryAfter);
			
				if (selectedUser) {
					const systemMessage: Message = {
						id: Date.now(),
						text: "Chat invite unavailable. Try again later", // "TODO: translate
						sender: "me",
						type: "text",
					};
			
					setMessagesByUser(prev => ({
						...prev,
						[selectedUser.id]: [
							...(prev[selectedUser.id] ?? []),
							systemMessage,
						],
					}));
				}
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
				alert(t("chat.placeholder.alert"));
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
			type: "text",
		};

		setMessagesByUser(prev => ({
			...prev,
			[selectedUser.id]: [...(prev[selectedUser.id] ?? []), myMessage],
		}));

		setUsers( prev =>
			prev.map( u => u.id === selectedUser.id ? { ...u, lastMessage: text } : u )
		);
  	};

	const acceptAndJoinInvite = (userId: string, inviteId: number) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
		const msg = messagesByUser[userId]?.find(m => m.id === inviteId);
		if (msg?.invite?.status !== "pending") return;

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
		if (isInviteDisabled) return; 
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
	<div className="fixed inset-0 z-50 pointer-events-none">
		<SideTab isOpen={chatIsOpen}>
		<div className="pointer-events-auto h-full w-full">
			{profileUser ? (
			<ChatProfile
				user={profileUser}
				onExitClick={() => setProfileUser(null)}
			/>
			) : selectedUser ? (
			<Discussion
				friend={selectedUser}
				messages={messagesByUser[selectedUser.id] ?? []}
				onSendMessage={sendMessage}
				onExitClick={() => setSelectedUser(null)}
				onSendInvite={sendGameInvite}
				onAcceptInvite={(inviteId) =>
				acceptAndJoinInvite(selectedUser.id, inviteId)
				}
				onProfileClick={setProfileUser}
			/>
			) : (
			<Chat
				users={usersWithPresence}
				selectedUserId={null}
				onChatClick={setSelectedUser}
				onProfileClick={setProfileUser}
			/>
			)}
		</div>
		</SideTab>

	<PopUp isOpen={chatIsOpen}>
		<div className="pointer-events-auto h-full w-full">
			{profileUser ? (
			<ChatProfile
				user={profileUser}
				onExitClick={() => setProfileUser(null)}
			/>
			) : selectedUser ? (
			<Discussion
				friend={selectedUser}
				messages={messagesByUser[selectedUser.id] ?? []}
				onSendMessage={sendMessage}
				onExitClick={() => setSelectedUser(null)}
				onSendInvite={sendGameInvite}
				onAcceptInvite={(inviteId) =>
				acceptAndJoinInvite(selectedUser.id, inviteId)
				}
				onProfileClick={setProfileUser}
				inviteDisabled={isInviteDisabled}
			/>
			) : (
			<Chat
				users={usersWithPresence}
				selectedUserId={null}
				onChatClick={setSelectedUser}
				onProfileClick={setProfileUser}
			/>
			)}
		</div>
		</PopUp>
	</div>
	);
};
