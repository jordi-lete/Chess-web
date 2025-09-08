import React, { useState, useRef } from "react";
import "./Board.css";
import pieceImages from "./Pieces"
import moveDot from "../../assets/circle_tp.png"

export default function Board({ chessModule }) {
    const [board, setBoard] = useState(() => readBoard(chessModule));
    const [selected, setSelected] = useState(null);
    const [status, setStatus] = useState("Game started. White to move");
    const [legalMoves, setLegalMoves] = useState([]);

    const mouseDownSquare = useRef(null);
    const boardRef = useRef(null);

    // ------------------ Helpers ------------------

    function readBoard(module) {
        const newBoard = [];
        for (let r = 0; r < 8; r++) {
        const row = [];
        for (let c = 0; c < 8; c++) {
            row.push(module._get_piece(c, r));
        }
        newBoard.push(row);
        }
        return newBoard;
    }

    const squareFromClient = (clientX, clientY) => {
        const el = boardRef.current;
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;
        const file = Math.floor(relX / 60);
        const rank = Math.floor(relY / 60);
        if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
        return { file, rank };
    };

    const getLegalMoves = (file, rank) => {
        const maxMoves = 28; // max possible moves for a single piece
        const ptr = chessModule._malloc(maxMoves * 2 * Int32Array.BYTES_PER_ELEMENT);

        const count = chessModule._get_legal_moves(file, rank, ptr);

        const moves = [];
        for (let i = 0; i < count; i++) {
            const f = chessModule.getValue(ptr + i * 8, 'i32');     // file
            const r = chessModule.getValue(ptr + i * 8 + 4, 'i32'); // rank
            moves.push({ file: f, rank: r });
        }

        chessModule._free(ptr);
        return moves;
    };

    const tryMove = (from, to) => {
        let promotionPiece = 0;
        const movingPiece = chessModule._get_piece(from.file, from.rank);
        if (movingPiece === 1 && to.rank === 0) promotionPiece = 5;
        else if (movingPiece === 6 && to.rank === 7) promotionPiece = 11;
        const success = chessModule._try_move(from.file, from.rank, to.file, to.rank, promotionPiece);
        if (success) //Valid move
        {
            console.log("Valid move received");
            setBoard(readBoard(chessModule));
            setStatus("Piece moved");
        }
        else {
            console.log("Invalid move");
            setStatus("Invalid move");
        }
    };

    // ------------------ Event Handlers ------------------

    const onSquareMouseDown = (e, file, rank) => {
        // Left click only
        if (e.button !== 0) return;
        e.preventDefault();

        if (!selected) setLegalMoves(getLegalMoves(file, rank));

        mouseDownSquare.current = { file, rank };

        // window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseUp = (e) => {
        window.removeEventListener("mouseup", onMouseUp);
        const start = mouseDownSquare.current;
        mouseDownSquare.current = null;
        if (!start) return;

        const end = squareFromClient(e.clientX, e.clientY);
        if (!end) return;

        if (start.file === end.file && start.rank === end.rank) {
            // It's a click
            handleSquareClick(end.file, end.rank);
        }
        else {
            // It's a drag
            tryMove(start, end);
            setSelected(null);
            setLegalMoves([]);
        }

    };

    const handleSquareClick = (file, rank) => {
        const piece = board[rank][file];

        if (!selected) {
            if (piece === 0) {
                setStatus("No piece selected");
                return;
            }
            setSelected({ file, rank });
            setStatus(`Selected ${piece} at [${file}, ${rank}]`);

            // Get the legal moves for the selected piece
            const moves = getLegalMoves(file, rank);
            setLegalMoves(moves);
        }
        else{
            tryMove(selected, {file, rank});
            setSelected(null);
            setLegalMoves([]); // Clear the legal moves display after move made
        }
    };

    return (
        <div>
            <div id="board" ref={boardRef}>
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
                        onMouseDown={(ev) => onSquareMouseDown(ev, cIdx, rIdx)}
                    >
                        {pieceEnum != 0 && (
                            <img
                                src={pieceImages[pieceEnum]}
                                alt=""
                                className={"piece"}
                                draggable={false}
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