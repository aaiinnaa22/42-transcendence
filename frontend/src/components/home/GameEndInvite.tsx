interface GameEndProps {
    message?: string; // tells the reason why the game ended could be "timeout", "disconnected", etc.
}

export const GameEnd = ({ message }: GameEndProps) => {
  return (
    <div className="w-full flex justify-center">
      <h2 className="text-transcendence-white font-transcendence-three text-3xl tracking-[0.12em] text-center">
        {message}
      </h2>
    </div>
  );
};
