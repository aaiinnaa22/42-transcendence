type ChatProfileProps =
{
	onExitClick: () => void;
}

export const ChatProfile = ({onExitClick}: ChatProfileProps) => {
	return (
		<div className="flex flex-col h-full items-center justify-between py-30">
			<button onClick={onExitClick} className="fixed top-5 left-2 material-symbols-outlined !text-md cursor-pointer">arrow_back_ios_new</button>
			<div className="flex flex-col items-center gap-6">
				<h2 className="font-bold text-lg border-b-3">Susan</h2>
				<img className="w-40 h-40 rounded-full object-cover border-3" src="/testimage.png"></img>
			</div>
			<div className="flex flex-col items-center gap-5 bg-transcendence-black px-12 py-5 rounded-xl text-white ">
				<div className="flex flex-col items-center gap-1">
					<h4>games played</h4>
					<p className="text-lg font-bold">4</p>
				</div>
				<div className="flex flex-col items-center gap-1">
					<h4>rating</h4>
					<p className="text-lg font-bold">1200</p>
				</div>
				<div className="flex flex-col items-center gap-1">
					<h4>wins</h4>
					<p className="text-lg font-bold">3</p>
				</div>
				<div className="flex flex-col items-center gap-1">
					<h4>losses</h4>
					<p className="text-lg font-bold">5</p>
				</div>
			</div>
			<div className="flex flex-col items-center gap-3">
				<h4 className="font-bold">befriend</h4>
				<h4 className="text-transcendence-red font-bold">block</h4>
			</div>

		</div>
	)
}

//rating wins losses
//befriend unfriend block