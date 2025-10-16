type SignInProps = {
	onLoginSuccess: () => void;
};

export const SignUp = ({onLoginSuccess}: SignInProps) => {
	return (
		<div className="bg-transcendence-black min-h-screen w-full flex flex-col gap-30 items-center">
			<h1 className="text-transcendence-white font-transcendence-two font-extrabold text-3xl mt-20 tracking-[0.4rem] text-center">sign up</h1>
			<div className="flex flex-col justify-center items-center text-2xl font-transcendence-two text-transcendence-white text-left gap-10 w-125">
				<div className="w-full flex flex-row justify-between">
					<span>email:</span>
					<input type="text" id="email" name="email" placeholder=" type in your email" className="border-2 placeholder:text-lg"/>
				</div>
				<div className="w-full flex flex-row justify-between">
					<span>username:</span>
					<input type="text" id="username" name="username" placeholder=" type in your username" className="border-2 placeholder:text-lg"/>
				</div>
				<div className="w-full flex flex-row justify-between">
					<span>password:</span>
					<input type="password" id="password" name="password" placeholder=" type in your password" className="border-2 placeholder:text-lg"/>
				</div>
				<div className="bg-transcendence-beige flex rounded-2xl w-35 h-18 align-center font-bold justify-center text-center mt-5">
					<button className="text-transcendence-black cursor-pointer hover:pt-2" type="submit">submit</button>
				</div>
			</div>
		</div>
	);
};