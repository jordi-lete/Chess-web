import React, { useState } from "react";
import "./Board.css";
import pieceImages from "./Pieces"
import moveDot from "../../assets/circle_tp.png"

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
    const [legalMoves, setLegalMoves] = useState([]);

    const handleSquareClick = (row, col) => {
        const piece = board[row][col];

        if (!selected) {
            if (piece === "") {
                setStatus("No piece selected");
                return;
            }
            setSelected({ row, col });
            setStatus(`Selected ${piece} at [${row}, ${col}]`);

            // Get the legal moves for the selected piece
            const moves = getLegalMoves(chessModule, col, row);
            setLegalMoves(moves);
        }
        else{
            let promotionPiece = 0;
            const movingPiece = chessModule._get_piece(selected.col, selected.row);
            if (movingPiece === 1 && row === 0) promotionPiece = 5;
            else if (movingPiece === 6 && row === 7) promotionPiece = 11;
            console.log(`selected piece: ${movingPiece}, promoting to: ${promotionPiece}`);
            const success = chessModule._try_move(selected.col, selected.row, col, row, promotionPiece);
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
            setLegalMoves([]); // Clear the legal moves display after move made
        }
    };

    const getLegalMoves = (chessModule, file, rank) => {
        const maxMoves = 28; // max possible moves for a single piece
        const ptr = chessModule._malloc(maxMoves * 2 * Int32Array.BYTES_PER_ELEMENT);

        const count = chessModule._get_legal_moves(file, rank, ptr);

        const result = [];
        for (let i = 0; i < count; i++) {
            const f = chessModule.getValue(ptr + i * 8, 'i32');     // file
            const r = chessModule.getValue(ptr + i * 8 + 4, 'i32'); // rank
            result.push({ file: f, rank: r });
        }

        chessModule._free(ptr);
        return result;
    };

    return (
        <div>
            <div id="board">
                {board.map((row, rIdx) =>
                row.map((pieceEnum, cIdx) => {
                    const isLight = (rIdx + cIdx) % 2 === 0;
                    const isSelected = selected && selected.row === rIdx && selected.col === cIdx;
                    const isLegalMove = legalMoves.some(m => m.rank === rIdx && m.file === cIdx);
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
                        {isLegalMove && (
                            <img
                            src={moveDot}
                            alt=""
                            className="moves"
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