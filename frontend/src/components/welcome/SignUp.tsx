export const SignUp = () => {
	return (
		<div className="flex flex-col justify-center items-center font-transcendence-two text-transcendence-white text-left gap-10 landscape:gap-4 lg:landscape:gap-10">
			<input type="text" id="email" name="email" placeholder="email" className="border-1 rounded-lg placeholder:text-lg px-3 text-lg w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
			<input type="text" id="username" name="username" placeholder="username" className="border-1 rounded-lg placeholder:text-lg px-3 text-lg w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
			<input type="password" id="password" name="password" placeholder="password" className="border-1 rounded-lg placeholder:text-lg px-3 text-2xl w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
			<div className="bg-transcendence-beige flex rounded-2xl w-35 h-18 align-center text-md font-bold justify-center text-center mt-5 landscape:mt-3 lg:landscape:mt-10 tracking-wider landscape:text-xs landscape:w-20 landscape:h-14 lg:landscape:text-lg lg:landscape:w-35 lg:landscape:h-18">
				<button className="text-transcendence-black cursor-pointer hover:pt-2" type="submit">SUBMIT</button>
			</div>
		</div>
	);
};