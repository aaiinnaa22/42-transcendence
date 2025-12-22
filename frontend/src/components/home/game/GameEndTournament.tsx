interface GameEndProps {
    winner: string;         // username of the winner
    loser: string;          // username of the loser
    eloWinner?: number;     // new elo of the winner
    eloLoser?: number;      // new elo of loser
    eloWinnerOld?: number;  // old elo
    message?: string;       // tells the reason why the game ended could be "timeout", "disconnected", etc.
}

export const GameEnd = ({ winner, loser, eloWinner, eloLoser, eloWinnerOld, message }: GameEndProps) =>
{
    const difWinner =
    eloWinner !== undefined && eloWinnerOld !== undefined
        ? eloWinner - eloWinnerOld
        : null;
    return (
        <div className="w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] flex items-center justify-center">
  <div className="w-full max-w-3xl max-h-[80vh] rounded-xl bg-transcendence-beige p-2 overflow-y-auto flex flex-col gap-2">
    
    {/* Optional message */}
    {message && (
      <h2 className="text-transcendence-black font-transcendence-three text-3xl tracking-[0.12em] text-center mb-2">
        {message}
      </h2>
    )}

    {/* Winner row */}
    <div className="ending-grid px-2 py-1 items-center justify-center bg-transcendence-black">
      <span className="text-left truncate font-bold text-transcendence-white w-15 lg:w-43">{winner}</span>
      <span className="text-right font-bold text-transcendence-white">{eloWinner}</span>
      <span className="inline-block animate-bounce">
        <span className="text-right font-bold text-green-500">+{difWinner}</span>
      </span>
    </div>

    {/* Loser row */}
    <div className="ending-grid px-2 py-1 items-center justify-center bg-transcendence-black">
      <span className="text-left truncate font-bold text-transcendence-white w-15 lg:w-43">{loser}</span>
      <span className="text-right font-bold text-transcendence-white">{eloLoser}</span>
      <span className="inline-block animate-bounce">
        <span className="text-right font-bold text-red-500">-{difWinner}</span>
      </span>
    </div>

  </div>
</div>

    );
};