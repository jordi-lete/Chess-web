import { useState, useEffect } from "react";

function WasmLoader({ children }) {
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

  if (!chessModule) {
    return <p>Loading chess engine...</p>;
  }

  console.log("Engine loaded")
  return children(chessModule);
}

export default WasmLoader;