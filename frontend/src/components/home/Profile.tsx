import { useState, useEffect, useRef } from 'react'
import { Settings } from "./settings/Settings"
import { apiUrl } from '../../api/api';
import { PendingFriendRequests } from './utils/PendingFriendRequests';
import { fetchWithAuth } from "../../api/fetchWithAuth";
import { BaseModal } from "./settings/BaseModal";
import { useTranslation } from 'react-i18next';

export const Profile = () => {
	const [profilePic, setProfilePic] = useState<string | null>(null);
	const [username, setUsername] = useState("User");
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [newUsername, setNewUsername] = useState("");
	const [editError, setEditError] = useState<string | null>(null);
	const profilePicInputRef = useRef<HTMLInputElement | null>(null);

	const {t} = useTranslation();

	useEffect(() => {
		const getUserInfo = async() => {
			try {
				const response = await fetchWithAuth( apiUrl("/auth/me"),
				{
					method: "GET",
					credentials: "include",
				});
				const data = await response.json();

				setUsername(data.username || t("profile.defaultUsername"));

				if (data.avatar)
				{
					setProfilePic(data.avatar);
				}
				else
				{
					setProfilePic("/avatars/00000000-0000-0000-0000-000000000000.webp");
				}
			}
			catch {
				console.error("Failed to fetch user info");
			};
		};
		getUserInfo();
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

			const response = await fetchWithAuth( apiUrl('/users/avatar'),
			{
				method: "POST",
				credentials: "include",
				body: formData,
			});

			if (response.ok)
			{
				// Set image from backend
				const data = await response.json();
				setProfilePic(data.avatarUrl);
			}
		}
		catch {
			console.error("Failed to store profile picture");
			setProfilePic("/avatars/00000000-0000-0000-0000-000000000000.webp");
		};
	};

	return (
		<div className='w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] flex flex-col justify-center items-center'>
			<div className=" grid
				landscape:grid-cols-[auto_auto] landscape:grid-rows-[auto_auto] lg:landscape:grid-cols-[auto_auto_auto] lg:landscape:grid-rows-[auto_auto_auto]
				portrait:grid-cols-[auto_auto_auto] portrait:grid-rows-[auto_auto_auto]
				gap-10 xl:gap-15">
				<div className="col-start-2 lg:landscape:justify-center flex portrait:justify-center items-center gap-2">
					<h2 className="text-transcendence-white font-transcendence-three tracking-[0.2em] font-semibold text-3xl">{t("profile.greeting", { username } )}</h2>
					<button
						className="flex items-center justify-center w-8 h-8 rounded-full border border-transcendence-beige text-transcendence-black bg-transcendence-beige hover:opacity-90"
						onClick={() => { setNewUsername(username); setIsEditOpen(true); }}
						>
						<span className="material-symbols-outlined">edit</span>
					</button>
				</div>
				<div className="flex flex-col
					landscape:col-start-1 landscape:row-start-2 lg:landscape:col-start-2 lg:landscape:row-start-2
					portrait:col-start-2 portrait:row-start-2
					justify-center items-center gap-4">
						<div className="relative">
						{profilePic
						? <img className="h-40 w-40 xl:h-60 xl:w-60 rounded-full object-cover" src={profilePic}></img>
						: <span className="material-symbols-outlined text-transcendence-white !text-9xl">account_circle</span>}
						<button
							className="absolute top-1 right-2 bg-transcendence-white w-8 h-8 rounded-full border-2 border-transcendence-black flex flex-col justify-center items-center cursor-pointer"
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
				<div className='portrait:col-start-2 portrait:row-start-3
					landscape:col-start-3 landscape:row-start-2
					lg:landscape:col-start-2 lg:landscape:row-start-3
					flex flex-col items-center justify-center h-35'>
					<PendingFriendRequests/>
				</div>
				<div className="landscape:col-start-2 landscape:row-start-2 lg:landscape:col-start-2 lg:landscape:row-start-4 lg:landscape:items-center
					portrait:col-start-2 portrait:row-start-4 portrait:items-center
					flex flex-col justify-center">
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
								{t("profile.cancel")}
							</button>
							<button
								className="px-3 py-2 rounded-lg bg-transcendence-beige text-transcendence-black font-semibold"
								onClick={async () => {
									setEditError(null);
									const name = newUsername.trim();
									if (!name) { setEditError( t("profile.userNotEmpty") ); return; }
									try {
										const resp = await fetchWithAuth( apiUrl("/users/me"), {
											method: "PUT",
											credentials: "include",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({ username: name }),
										});
										const data = await resp.json();
										if (!resp.ok || data.error) {
											throw new Error(data.error || data.message || t("profile.updateFailed") );
										}
										setUsername(name);
										setIsEditOpen(false);
									} catch (err: any) {
										setEditError((err && err.message) || t("profile.updateFailed") );
									}
							}}
						>
							{t("profile.save")}
							</button>
						</div>
					</BaseModal>
				)}
			</div>
		</div>
	);
}
