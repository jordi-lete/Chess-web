import React, { useState } from "react";
import "./Board.css";

const startingPosition = [
    ["♜","♞","♝","♛","♚","♝","♞","♜"], // Black back rank
    ["♟","♟","♟","♟","♟","♟","♟","♟"], // Black pawns
    ["","","","","","","",""],          // Empty row
    ["","","","","","","",""],          // Empty row
    ["","","","","","","",""],          // Empty row
    ["","","","","","","",""],          // Empty row
    ["♙","♙","♙","♙","♙","♙","♙","♙"], // White pawns
    ["♖","♘","♗","♕","♔","♗","♘","♖"]  // White back rank
];

export default function Board() {
    const [board, setBoard] = useState(startingPosition);
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
        else {
            if (selected.row === row && selected.col === col) {
                setSelected(null);
                setStatus("Selection cleared")
                return;
            }
        }

        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = board[selected.row][selected.col];
        newBoard[selected.row][selected.col] = "";

        setBoard(newBoard);
        setSelected(null);
        setStatus("Piece moved");
    };

    return (
        <div>
            <div id="board">
                {board.map((row, rIdx) =>
                row.map((piece, cIdx) => {
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
                        {piece}
                    </div>
                    );
                })
                )}
            </div>
            <div id="status">{status}</div>
        </div>
    );
}