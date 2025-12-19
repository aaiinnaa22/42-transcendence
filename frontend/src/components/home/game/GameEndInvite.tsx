interface GameEndProps {
    message?: string; // tells the reason why the game ended could be "timeout", "disconnected", etc.
}

export const GameEnd = ({ message }: GameEndProps) =>
{
    return (
        <div className="w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] flex justify-center items-center">
            <h2 className="text-transcendence-white font-transcendence-three text-3xl tracking-[0.12em] text-center"> {message} </h2>
        </div>
    );
};