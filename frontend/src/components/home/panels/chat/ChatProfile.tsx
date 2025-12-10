type ChatProfileProps =
{
	onExitClick: () => void;
}

export const ChatProfile = ({onExitClick}: ChatProfileProps) => {
	return (
		<div className="flex flex-col h-full bg-transcendence-white rounded-l-2xl px-5 py-20 justify-between">
			<button onClick={onExitClick} className="fixed top-5 left-2 material-symbols-outlined !text-md cursor-pointer">arrow_back_ios_new</button>
			<div className="flex flex-col items-center gap-8 justify-between w-full">
				<h2 className="font-bold text-lg border-b-2 h-fit w-full">Susan</h2>
				<img className="w-40 h-40 rounded-full object-cover border-2" src="/testimage.png"></img>
			</div>
			<div className="grid grid-cols-[auto_auto] grid-rows-[auto_auto_auto] gap-5">
				<h3 className="font-bold border-b-1 col-span-2">stats</h3>
				<div className="col-span-2 flex justify-center border-2 rounded-lg p-2">
					<h4 className="text-sm"><span className="font-bold !text-md">45</span> games played in total</h4>
				</div>
				<div className="bg-transcendence-beige flex flex-col justify-center items-center rounded-lg p-1">
					<h4 className="text-md font-bold">4</h4>
					<p className="text-sm">games won</p>
				</div>
				<div className="bg-transcendence-black text-transcendence-white flex flex-col justify-center items-center rounded-lg p-1">
					<h4 className="text-md font-bold">11</h4>
					<p className="text-sm">games lost</p>
				</div>
				<div className="col-span-2 flex justify-center p-1 rounded-lg">
					<h4 className="tracking-wide text-sm border-b-2 font-bold">RATING: 1400</h4>
				</div>
			</div>
			<div className="flex flex-col gap-5">
				<h3 className="font-bold border-b-1">settings</h3>
				<div className="flex flex-col px-2 gap-1">
					<h4 className="font-bold text-sm">befriend</h4>
					<h4 className="font-bold text-sm text-transcendence-red">block</h4>
				</div>
			</div>
		</div>
	)
}

//rating wins losses
//befriend unfriend block