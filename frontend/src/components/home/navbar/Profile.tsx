

export const Profile = () =>
{
	return (
		<div className="relative w-[1.75em] h-[1.75em] flex items-center justify-center group">
			<span className="absolute rounded-full w-[1.5em] h-[1.5em] bg-transparent group-hover:bg-transcendence-white"></span>
			<span className="relative material-symbols-outlined !text-3xl cursor-pointer">account_circle</span>
		</div>
	);
}