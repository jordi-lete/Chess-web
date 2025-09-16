import React, { useState, useRef } from "react";
import "./Board.css";
import pieceImages from "./Pieces"
import moveDot from "../../assets/circle_tp.png"

export default function Board({ chessModule }) {
    const [board, setBoard] = useState(() => readBoard(chessModule));
    const [selected, setSelected] = useState(null);
    const [status, setStatus] = useState("Game started. White to move");
    const [legalMoves, setLegalMoves] = useState([]);
    const [dragging, setDragging] = useState(null); // {file, rank, piece, x, y, offsetX, offsetY}

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
        const squareSize = rect.width / 8;
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;
        const file = Math.floor(relX / squareSize);
        const rank = Math.floor(relY / squareSize);
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

    const handleSquareClick = (file, rank) => {
        const piece = board[rank][file];
        if (piece != 0 && ((piece < 7 && chessModule._get_current_turn() === 1) || (piece > 6 && chessModule._get_current_turn() === 0))) {
            setSelected({ file, rank });
            setStatus(`Selected ${piece} at [${file}, ${rank}]`);

            // Get the legal moves for the selected piece
            const moves = getLegalMoves(file, rank);
            setLegalMoves(moves);
        }
        else if (!selected) {
            if (piece === 0) {
                setStatus("No piece selected");
                return;
            }
            else if (piece < 7 && chessModule._get_current_turn() === 0) return;
            else if (piece > 6 && chessModule._get_current_turn() === 1) return;

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

    // ------------------ Event Handlers ------------------

    const onSquareMouseDown = (e, file, rank) => {
        // Left click only
        if (e.button !== 0) return;
        e.preventDefault();

        const piece = board[rank][file];

        mouseDownSquare.current = { file, rank };

        const rect = e.currentTarget.getBoundingClientRect();
        if (piece != 0) {
            setLegalMoves(getLegalMoves(file, rank));
            setDragging({
                file,
                rank,
                piece,
                x: e.clientX,
                y: e.clientY,
                offsetX: e.clientX - rect.left,
                offsetY: e.clientY - rect.top,
            });
        }
        
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
        setDragging((d) => d && { ...d, x: e.clientX, y: e.clientY });
    }

    const onMouseUp = (e) => {
        const start = mouseDownSquare.current;
        mouseDownSquare.current = null;

        const end = squareFromClient(e.clientX, e.clientY);
        if (start && end) {
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
        }

        cleanup();
    };

    const cleanup = () => {
        setDragging(null);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
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
                        className={`square ${isLight ? "light" : "dark"}`}
                        onMouseDown={(ev) => onSquareMouseDown(ev, cIdx, rIdx)}
                    >
                        {pieceEnum !== 0 && !(dragging && dragging.file === cIdx && dragging.rank === rIdx) && (
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
                        {rIdx === 7 && (
                            <span className={`file-label ${isLight ? "dark-text" : "light-text"}`}>
                                {String.fromCharCode(97 + cIdx)}
                            </span>
                        )}
                        {cIdx === 0 && (
                            <span className={`rank-label ${isLight ? "dark-text" : "light-text"}`}>
                                {8 - rIdx}
                            </span>
                        )}
                    </div>
                    );
                })
                )}
            </div>
            {dragging && (
                <img
                    src={pieceImages[dragging.piece]}
                    alt=""
                    className="dragging-piece"
                    style={{
                    top: `${dragging.y - dragging.offsetY}px`,
                    left: `${dragging.x - dragging.offsetX}px`,
                    width: boardRef.current ? boardRef.current.getBoundingClientRect().width / 8 : 0,
                    height: boardRef.current ? boardRef.current.getBoundingClientRect().height / 8 : 0,
                    }}
                />
            )}
            <div id="status">{status}</div>
        </div>
    );
}