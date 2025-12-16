import { useState, useEffect, useRef } from 'react'
import { Settings } from "./settings/Settings"
import { apiUrl } from '../../api/api';
import { BaseModal } from "./settings/BaseModal";

export const Profile = () => {
	const [profilePic, setProfilePic] = useState<string | null>(null);
	const [username, setUsername] = useState("User");
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [newUsername, setNewUsername] = useState("");
	const [editError, setEditError] = useState<string | null>(null);
	const profilePicInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		const getUserInfo = async() => {
			try {
				const response = await fetch( apiUrl('/auth/me'),
				{
					method: "GET",
					credentials: "include",
				});
				const data = await response.json();

				setUsername(data.username || "User");

				if (data.avatarType === "provider")
				{
					setProfilePic(profilePic || null);
				}
				else if (data.avatarType === "local")
				{
					const avatarResponse = await fetch( apiUrl('/users/avatar'),
					{
						method: "GET",
						credentials: "include",
					});

					if (avatarResponse.ok)
					{
						const avatarBlob = await avatarResponse.blob();
						const avatarUrl = URL.createObjectURL(avatarBlob);
						setProfilePic(avatarUrl);
					}
				}
			}
			catch {
				console.error("Failed to fetch user info");
			};
		};
		getUserInfo();

		return () => {
			if (profilePic && profilePic.startsWith("blob:"))
			{
				URL.revokeObjectURL(profilePic);
			}
		}
	});

	const handleProfilePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const profilePicFile = event.target.files?.[0];
		if (!profilePicFile) return;

		// Preview the uploaded image
		const profileUrl = URL.createObjectURL(profilePicFile);
		setProfilePic(profileUrl);


		try {
			const formData = new FormData();
			formData.append("file", profilePicFile);

			const response = await fetch( apiUrl('/users/avatar'),
			{
				method: "POST",
				credentials: "include",
				body: formData,
			});

			if (response.ok)
			{
				// Set image from backend
				const avatarBlob = await response.blob();
				const avatarUrl = URL.createObjectURL(avatarBlob);

				// Prevent memory leak
				if (profileUrl)
				{
					URL.revokeObjectURL(profileUrl);
				}
				setProfilePic(avatarUrl);
			}


		}
		catch {
			console.error("Failed to store profile picture");
			setProfilePic(null);
		};
	};

	return (
		<div className="w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] grid grid-cols-[auto_auto_auto] grid-rows-[auto_auto_auto] py-[10vh]">
			<div className="flex flex-col col-start-2 items-center gap-4">
				<div className="flex items-center gap-2">
					<h2 className="text-transcendence-white font-transcendence-three tracking-[0.2em] font-semibold text-3xl">Hi {username}!</h2>
					<button
						className="flex items-center justify-center w-8 h-8 rounded-full border border-transcendence-beige text-transcendence-black bg-transcendence-beige hover:opacity-90"
						onClick={() => { setNewUsername(username); setIsEditOpen(true); }}
					>
						<span className="material-symbols-outlined">edit</span>
					</button>
				</div>
				<div className="relative inline-block">
					{profilePic
					? <img className="h-35 w-35 rounded-full" src={profilePic}></img>
					: <span className="material-symbols-outlined text-transcendence-white !text-9xl">account_circle</span>}
					<button
						className="absolute top-2 right-2 bg-transcendence-white w-8 h-8 rounded-full border-2 border-transcendence-black flex flex-col justify-center items-center cursor-pointer"
						onClick={() => profilePicInputRef.current?.click()}>
						<span className="material-symbols-outlined text-transcendence-black">photo_camera</span>
						<input
							type="file"
							accept="image/*"
							className="hidden"
							ref={profilePicInputRef}
							onChange={handleProfilePicChange}>
						</input>
					</button>
				</div>
			</div>
			<div className="col-start-2 row-start-2 flex flex-col items-center">
				<Settings/>
			</div>

			{isEditOpen && (
				<BaseModal isOpen={isEditOpen} title="Edit Username" onClose={() => setIsEditOpen(false)}>
					<p className="text-xs text-transcendence-white/80">Enter a new username.</p>
					<input
						type="text"
						value={newUsername}
						onChange={(e) => setNewUsername(e.target.value)}
						className="border border-transcendence-beige bg-transparent rounded-lg px-3 py-2 text-sm"
						placeholder="New username"
					/>
					{editError && <div className="text-red-500 text-xs">{editError}</div>}
					<div className="flex gap-2 justify-end mt-2">
						<button
							className="px-3 py-2 rounded-lg border border-transcendence-beige text-transcendence-beige"
							onClick={() => setIsEditOpen(false)}
						>
							Cancel
						</button>
						<button
							className="px-3 py-2 rounded-lg bg-transcendence-beige text-transcendence-black font-semibold"
							onClick={async () => {
								setEditError(null);
								const name = newUsername.trim();
								if (!name) { setEditError("Username cannot be empty"); return; }
								try {
									const resp = await fetch( apiUrl("/users/me"), {
										method: "PUT",
										credentials: "include",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({ username: name }),
									});
									const data = await resp.json();
									if (!resp.ok || data.error) {
										throw new Error(data.error || data.message || "Failed to update username");
									}
									setUsername(name);
									setIsEditOpen(false);
								} catch (err: any) {
									setEditError((err && err.message) || "Update failed");
								}
						}}
					>
						Save
						</button>
					</div>
				</BaseModal>
			)}
		</div>
	);
}
