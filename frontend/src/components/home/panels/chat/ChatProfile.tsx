
type ChatProfileProps =
{
	onExitClick: () => void;
}

export const ChatProfile = ({onExitClick}: ChatProfileProps) => {



	return (
		<div className="overflow-y-auto flex flex-col h-full bg-transcendence-white lg:rounded-l-2xl px-5 py-14 justify-between gap-5 lg:border-2
			portrait:items-center portrait:px-[10%]
			lg:portrait:items-start lg:portrait:px-5
			portrait:gap-10">
			<div className="fixed top-0 w-[90%] lg:mt-[2px] h-10 bg-transcendence-white flex items-center">
				<button onClick={onExitClick} className="material-symbols-outlined !text-md cursor-pointer">arrow_back_ios_new</button>
			</div>
			<div className="flex flex-col items-center justify-center lg:gap-5 w-full flex-grow">
				<div className="flex flex-col items-center justify-between w-full gap-2">
					<h2 className="font-bold text-md md:text-lg border-b-2 h-fit w-full
						portrait:text-center lg:portrait:text-left
						portrait:w-fit lg:portrait:w-full">Susan</h2>
					<div className="flex w-full gap-1 items-center">
						<p className="text-xs md:text-sm text-right w-full">currently offline</p>
						<span className="bg-transcendence-red border-1 lg:border-2 w-2 h-2 lg:w-4 lg:h-4 rounded-full"></span>
					</div>
				</div>
				<img className="rounded-full object-cover border-2 w-full max-w-40 aspect-square" src="/testimage.png"></img>
			</div>
			<div className="grid grid-cols-[auto_auto] grid-rows-[auto_auto_auto] gap-5 w-full flex-grow">
				<div className="col-span-2 w-full portrait:flex justify-center items-center">
					<h3 className="text-sm md:text-lg font-bold border-b-1 col-span-2 max-h-6
						portrait:w-fit lg:portrait:w-full">stats</h3>
				</div>
				<div className="col-span-2 flex justify-center items-center border-2 rounded-lg p-2
					portrait:p-4 lg:portrait:p-2">
					<h4 className="text-xs md:text-sm"><span className="font-bold !text-md">45</span> games played in total</h4>
				</div>
				<div className="bg-transcendence-beige flex flex-col justify-center items-center rounded-lg p-1
					portrait:p-4 lg:portrait:p-2">
					<h4 className="text-sm md:text-md font-bold">4</h4>
					<p className="text-xs md:text-sm">games won</p>
				</div>
				<div className="bg-transcendence-black text-transcendence-white flex flex-col justify-center items-center rounded-lg p-1
					portrait:p-4 lg:portrait:p-2">
					<h4 className="text-sm md:text-md font-bold">11</h4>
					<p className="text-xs md:text-sm">games lost</p>
				</div>
				<div className="col-span-2 flex justify-center p-1 rounded-lg">
					<h4 className="tracking-wide text-xs md:text-sm border-b-2 font-bold max-h-6">RATING: 1400</h4>
				</div>
			</div>
			<div className="flex flex-col gap-5 w-full flex-grow justify-center
				portrait:items-center lg:portrait:items-start
				portrait:text-center lg:portrait:text-left">
				<h3 className="text-sm md:text-lg font-bold border-b-1
				portrait:w-fit lg:portrait:w-full">settings</h3>
				<div className="flex flex-col px-2 gap-2">
					<h4 className="font-bold text-xs md:text-sm">befriend</h4>
					<h4 className="font-bold text-xs md:text-sm text-transcendence-red">block</h4>
				</div>
			</div>
		</div>
	)
}

//rating wins losses
//befriend unfriend block