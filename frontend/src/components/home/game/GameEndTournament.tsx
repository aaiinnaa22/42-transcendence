interface GameEndProps {
    winner: string;         // username of the winner
    loser: string;          // username of the loser
    eloWinner?: number;     // new elo of the winner
    eloLoser?: number;      // new elo of loser
    eloWinnerOld?: number;  // old elo
    eloLoserOld?: number;   // old elo
    pointsWinner?: number;  // game points
    pointsLoser?: number;   // game points
    message?: string;       // tells the reason why the game ended could be "timeout", "disconnected", etc.
}

export const GameEnd = ({ winner, loser, eloWinner, eloLoser, eloWinnerOld, eloLoserOld, pointsWinner, pointsLoser, message }: GameEndProps) =>
{
    const difWinner =
    eloWinner !== undefined && eloWinnerOld !== undefined
        ? eloWinner - eloWinnerOld
        : null;

    const difLoser =
    eloLoser !== undefined && eloLoserOld !== undefined
        ? eloLoserOld - eloLoser
        : null;

    return (
        <div className="min-h-screen flex items-center justify-center">
  <div className="w-full max-w-3xl max-h-[80vh] rounded-xl bg-transcendence-black p-4 overflow-y-auto flex flex-col gap-4">
    
    {/* Optional message */}
    {message && (
      <h2 className="text-transcendence-white font-transcendence-three text-3xl tracking-[0.12em] text-center">
        {message}
      </h2>
    )}

    {/* Winner row */}
    <div className="leaderboard-grid px-4 py-2 items-center">
      <span className="truncate text-left font-bold text-transcendence-white">{winner}</span>
      <span className="text-center font-bold text-transcendence-white">{eloWinnerOld}</span>
      <span className="flex justify-center">
        <span className="inline-block animate-bounce">
          <span className="material-symbols-outlined text-green-500">arrow_shape_up_stack_2</span>
        </span>
      </span>
      <span className="text-center font-bold text-transcendence-white hidden md:block">{eloWinner}</span>
      <span className="text-center font-bold text-green-500 hidden lg:block">+{difWinner}</span>
    </div>

    {/* Loser row */}
    <div className="leaderboard-grid px-4 py-2 items-center">
      <span className="truncate text-left font-bold text-transcendence-white">{loser}</span>
      <span className="text-center font-bold text-transcendence-white">{eloLoserOld}</span>
      <span className="flex justify-center">
        <span className="inline-block animate-bounce">
          <span className="material-symbols-outlined text-red-500 rotate-180">arrow_shape_up_stack_2</span>
        </span>
      </span>
      <span className="text-center font-bold text-transcendence-white hidden md:block">{eloLoser}</span>
      <span className="text-center font-bold text-red-500 hidden lg:block">-{difLoser}</span>
    </div>

  </div>
</div>

    );
};
