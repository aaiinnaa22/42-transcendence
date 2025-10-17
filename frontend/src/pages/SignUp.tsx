export const SignUp = () => {
	return (
		<div className="flex flex-col justify-center items-center font-transcendence-two text-transcendence-white text-left gap-10">
			<input type="text" id="email" name="email" placeholder="email" className="border-1 rounded-lg placeholder:text-lg px-3 text-lg w-75 h-10"/>
			<input type="text" id="username" name="username" placeholder="username" className="border-1 rounded-lg placeholder:text-lg px-3 text-lg w-75 h-10"/>
			<input type="password" id="password" name="password" placeholder="password" className="border-1 rounded-lg placeholder:text-lg px-3 text-2xl w-75 h-10"/>
			<div className="bg-transcendence-beige flex rounded-2xl w-35 h-18 align-center text-md font-bold justify-center text-center mt-5 tracking-wider">
				<button className="text-transcendence-black cursor-pointer hover:pt-2" type="submit">SUBMIT</button>
			</div>
		</div>
	);
};