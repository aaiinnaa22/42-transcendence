type ChatProfileProps =
{
	onExitClick: () => void;
}

export const ChatProfile = ({onExitClick}: ChatProfileProps) => {
	return (
		<div className="flex flex-col h-full bg-transcendence-white lg:rounded-l-2xl px-5 py-14 justify-between gap-5 lg:border-2">
			<button onClick={onExitClick} className="fixed top-5 left-2 material-symbols-outlined !text-md cursor-pointer">arrow_back_ios_new</button>
			<div className="flex flex-col items-center lg:gap-5 w-full">
				<div className="flex flex-col items-center justify-between w-full gap-2">
					<h2 className="font-bold text-md lg:text-lg border-b-2 h-fit w-full">Susan</h2>
					<div className="flex w-full gap-1 items-center">
						<p className="text-xs lg:text-sm text-right w-full">currently offline</p>
						<span className="bg-transcendence-red border-1 lg:border-2 w-2 h-2 lg:w-4 lg:h-4 rounded-full"></span>
					</div>
				</div>
				<img className="h-30 w-30 lg:w-40 lg:h-40 rounded-full object-cover border-2" src="/testimage.png"></img>
			</div>
			<div className="grid grid-cols-[auto_auto] grid-rows-[auto_auto_auto] gap-5">
				<h3 className="text-sm lg:text-md font-bold border-b-1 col-span-2">stats</h3>
				<div className="col-span-2 flex justify-center border-2 rounded-lg p-2">
					<h4 className="text-xs lg:text-sm"><span className="font-bold !text-md">45</span> games played in total</h4>
				</div>
				<div className="bg-transcendence-beige flex flex-col justify-center items-center rounded-lg p-1">
					<h4 className="text-sm lg:text-md font-bold">4</h4>
					<p className="text-xs lg:text-sm">games won</p>
				</div>
				<div className="bg-transcendence-black text-transcendence-white flex flex-col justify-center items-center rounded-lg p-1">
					<h4 className="text-sm lg:text-md font-bold">11</h4>
					<p className="text-xs lg:text-sm">games lost</p>
				</div>
				<div className="col-span-2 flex justify-center p-1 rounded-lg">
					<h4 className="tracking-wide text-xs lg:text-sm border-b-2 font-bold">RATING: 1400</h4>
				</div>
			</div>
			<div className="flex flex-col gap-5">
				<h3 className="text-sm lg:text-md font-bold border-b-1">settings</h3>
				<div className="flex flex-col px-2 gap-2">
					<h4 className="font-bold text-xs lg:text-sm">befriend</h4>
					<h4 className="font-bold text-xs lg:text-sm text-transcendence-red">block</h4>
				</div>
			</div>
		</div>
	)
}

//rating wins losses
//befriend unfriend block