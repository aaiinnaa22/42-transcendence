
export const CircleDiagram = ({percentage1, percentage2}: {percentage1: number, percentage2: number}) =>
(
	<div
		className="border-3 border-transcendence-white rounded-full bg-[conic-gradient(#22c55e_0_{@percentage1}%,#ef4444_50_{@percentage2})]
		w-20 h-20 lg:w-50 lg:h-50"
		style={{background: `conic-gradient(#000000 0% ${percentage2}%, #e2ddb4 ${percentage2}% ${percentage1 + percentage2}%)`,}}>
	</div>
);

//TODO: is style: allowed? thats pure css and not tailwind (also check if ? "" : "" is allowed)