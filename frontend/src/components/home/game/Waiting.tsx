interface WaitingProps {
	opponent: string;
}

export const Waiting = ({ opponent }: WaitingProps) =>
{
	return (
		<div className="relative w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] flex justify-center items-center">
			<h2 className="text-transcendence-white font-transcendence-three text-3xl tracking-[0.12em] text-center">Waiting for {opponent}...</h2>
		</div>
	);
};