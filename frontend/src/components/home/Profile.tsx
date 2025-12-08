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


		if (profilePic?.startsWith("blob:"))
		{
			URL.revokeObjectURL(profilePic);
		}

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

			 if (!response.ok)
			 {
				throw new Error("Failed to upload profile picture");
			 }
		}
		catch (err: unknown) {
			console.error(err);

			URL.revokeObjectURL(profileUrl);
			setProfilePic(null);
		};
	};

	return (
		<div className='w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] flex flex-col justify-center items-center'>
		<div className=" grid
			landscape:grid-cols-[auto_auto] landscape:grid-rows-[auto_auto] lg:landscape:grid-cols-[auto_auto_auto] lg:landscape:grid-rows-[auto_auto_auto]
			portrait:grid-cols-[auto_auto_auto] portrait:grid-rows-[auto_auto_auto]
			gap-10 xl:gap-15">
			<div className="col-start-2 lg:landscape:justify-center flex portrait:justify-center items-center">
			<h2 className="text-transcendence-white font-transcendence-three tracking-[0.2em] font-semibold text-3xl">Hi {username}!</h2>
			</div>
			<div className="flex flex-col
				landscape:row-span-2 landscape:row-start-1 lg:landscape:row-span-1 lg:landscape:col-start-2 lg:landscape:row-start-2
				portrait:col-start-2 portrait:row-start-2
				justify-center items-center gap-4">
				<div className="relative">
					{profilePic
					? <img className="h-40 w-40 xl:h-60 xl:w-60 rounded-full" src={profilePic}></img>
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
			<div className="landscape:col-start-2 landscape:row-start-2 lg:landscape:col-start-2 lg:landscape:row-start-3 lg:landscape:items-center
				portrait:col-start-2 portrait:row-start-3 portrait:items-center
				flex flex-col justify-center">
				<Settings/>
			</div>
		</div>
		</div>
	);
}