import { useEffect, useState } from "react";

function App() {
  // Store the loaded WASM module in React state
  const [chessModule, setChessModule] = useState(null);

  // Load chess.js from public folder when component mounts
  useEffect(() => {
    // Create <script> element dynamically
    const script = document.createElement("script");
    script.src = "/chess.js"; // from public/
    script.async = true;

    // When chess.js is loaded, initialize the WASM module
    script.onload = async () => {
      // window.ChessModule  is available if chess.js was compiled with:
      //   -s MODULARIZE=1 -s EXPORT_NAME="ChessModule"
      const module = await window.ChessModule();

      module._init_game();
      console.log("Game initialized.");
      console.log("Turn:", module._get_current_turn() === 1 ? "white" : "black");

      // Save the module to state so we can use it later
      setChessModule(module);
    };

    document.body.appendChild(script);

    // Cleanup: remove script if component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Try making a move: e2 → e4
  const tryMakeMove = () => {
    if (!chessModule) {
      console.log("WASM module not loaded yet!");
      return;
    }
    const success = chessModule._try_move(4, 6, 4, 4); // file=4 rank=1 to file=4 rank=3 (inverted ranks)
    console.log(success ? "Move played" : "Invalid move");
    console.log("Next turn:", chessModule._get_current_turn() === 1 ? "white" : "black");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chess WASM Test</h1>
      <p>
        {chessModule ? "WASM loaded" : "Loading WASM..."}
      </p>
      <button onClick={tryMakeMove} disabled={!chessModule}>
        Play e2 → e4
      </button>
    </div>
  );
}

export default App;
