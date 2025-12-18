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
    <div className="flex flex-col items-center justify-center portrait:flex-col portrait:items-center col-start-2 gap-4">
    <h2 className="text-transcendence-white font-transcendence-three text-3xl tracking-[0.12em]">
        {message}
    </h2>
    <div className="grid grid-cols-[minmax(8rem,1fr)_4rem_2rem_4rem_3rem] gap-x-1 items-center">
    <span className="truncate text-left text-transcendence-white font-transcendence-three text-3xl">{winner}</span>

    <span className="text-right text-transcendence-white font-transcendence-three text-3xl">{eloWinnerOld}</span>

    <span className="flex justify-center">
        <span className="inline-block animate-bounce">
            <span className="material-symbols-outlined text-green-500">
                arrow_shape_up_stack_2
            </span>
        </span>
    </span>

    <span className="text-right text-transcendence-white font-transcendence-three text-3xl">{eloWinner}</span>

    <span className="text-green-500 text-right font-transcendence-three text-3xl inline-block animate-bounce">
        +{difWinner}
    </span>
    </div>

    <div className="grid grid-cols-[minmax(8rem,1fr)_4rem_2rem_4rem_3rem] gap-x-1 items-center">
    <span className="truncate text-left text-transcendence-white font-transcendence-three text-3xl">{loser}</span>

    <span className="text-right text-transcendence-white font-transcendence-three text-3xl">{eloLoserOld}</span>

    <span className="flex justify-center">
        <span className="inline-block animate-bounce">
            <span className="material-symbols-outlined text-red-500 rotate-180">
                arrow_shape_up_stack_2
            </span>
        </span>
    </span>

    <span className="text-right text-transcendence-white font-transcendence-three text-3xl">{eloLoser}</span>

    <span className="text-red-500 text-right font-transcendence-three text-3xl inline-block animate-bounce">
        -{difLoser}
    </span>
    </div>
</div>
    );
};
