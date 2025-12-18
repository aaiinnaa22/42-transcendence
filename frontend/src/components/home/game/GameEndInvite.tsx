interface GameEndProps {
    message?: string; // tells the reason why the game ended could be "timeout", "disconnected", etc.
}

export const GameEnd = ({ message }: GameEndProps) =>
{
    return (
        <div className="relative w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] grid grid-cols-[10%_auto_10%] grid-rows-[15%_auto] p-5 lg:p-10">
            <div className="flex justify-center col-start-2">
                <h2 className="text-transcendence-white font-transcendence-three text-3xl tracking-[0.12em] self-end"> {message} </h2>
            </div>
        </div>
    );
};