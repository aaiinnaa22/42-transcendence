import {useState, useEffect, useRef} from 'react'
import {Settings} from "./settings/Settings"

export const Profile = () => {
	const [profilePic, setProfilePic] = useState<string | null>(null);
	const [username, setUsername] = useState("User");
	const profilePicInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		const getUserInfo = async() => {
			try {
				const response = await fetch("http://localhost:4241/auth/me",
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
					const avatarResponse = await fetch("http://localhost:4241/users/avatar",
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
			catch (err: any) {
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
	}, []);

	const handleProfilePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const profilePicFile = event.target.files?.[0];
		if (!profilePicFile) return;

		// Preview the uploaded image
		const profileUrl = URL.createObjectURL(profilePicFile);
		setProfilePic(profileUrl);


		try {
			const formData = new FormData();
			formData.append("file", profilePicFile);

			const response = await fetch("http://localhost:4241/users/avatar",
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
		catch (err: any) {
			console.error("Failed to store profile picture");
			setProfilePic(null);
		};
	};

	return (
		<div className="w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] grid grid-cols-[auto_auto_auto] grid-rows-[auto_auto_auto] py-[10vh]">
			<div className="flex flex-col col-start-2 items-center gap-4">
				<h2 className="text-transcendence-white font-transcendence-three tracking-[0.2em] font-semibold text-3xl">Hi {username}!</h2>
				<div className="relative inline-block">
					{profilePic
					? <img className="h-35 w-35 rounded-full object-cover" src={profilePic}></img>
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
		</div>
	);
}