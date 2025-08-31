import React, { useState } from "react";
import "./Board.css";
import pieceImages from "./Pieces"

export default function Board({ chessModule }) {
    const [board, setBoard] = useState(() => {
        const newBoard = [];
        for (let row = 0; row < 8; row++) {
            const rowArr = [];
            for (let col = 0; col < 8; col++) {
                rowArr.push(chessModule._get_piece(col, row));
            }
            newBoard.push(rowArr);
        }
        return newBoard;
    });

    const [selected, setSelected] = useState(null);
    const [status, setStatus] = useState("Game started. White to move");

    const handleSquareClick = (row, col) => {
        const piece = board[row][col];

        if (!selected) {
            if (piece === "") {
                setStatus("No piece selected");
                return;
            }
            setSelected({ row, col });
            setStatus(`Selected ${piece} at [${row}, ${col}]`);
        }
        else{
            const success = chessModule._try_move(selected.col, selected.row, col, row);
            console.log(`Tried move [${selected.row}, ${selected.col}] to [${row}, ${col}]`);

            if (success) //Valid move
            {
                console.log("Valid move received");
                const newBoard = [];
                for (let r = 0; r < 8; r++) {
                    const rowArr = [];
                    for (let c = 0; c < 8; c++) {
                        rowArr.push(chessModule._get_piece(c, r));
                    }
                    newBoard.push(rowArr);
                }
                setBoard(newBoard);
                setStatus("Piece moved");
            }
            else {
                console.log("Invalid move");
                setStatus("Invalid move");
            }
            setSelected(null);
        }
    };

    return (
        <div>
            <div id="board">
                {board.map((row, rIdx) =>
                row.map((pieceEnum, cIdx) => {
                    const isLight = (rIdx + cIdx) % 2 === 0;
                    const isSelected = selected && selected.row === rIdx && selected.col === cIdx;
                    return (
                    <div
                        key={`${rIdx}-${cIdx}`}
                        className={`square ${isLight ? "light" : "dark"} ${
                        isSelected ? "selected" : ""
                        }`}
                        onClick={() => handleSquareClick(rIdx, cIdx)}
                    >
                        {pieceEnum != 0 && (
                            <img
                                src={pieceImages[pieceEnum]}
                                alt=""
                                className="piece"
                            />
                        )}
                    </div>
                    );
                })
                )}
            </div>
            <div id="status">{status}</div>
        </div>
    );
}