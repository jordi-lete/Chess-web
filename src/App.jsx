import React from "react";
import Board from "./components/Board/Board"
import WasmLoader from "./components/wasm/wasmLoader";

function App() {
  return (
    <div className="App">
      <h1> Chess website </h1>
      <WasmLoader>
        {(chessModule) => (
          <Board chessModule={chessModule}/>
        )}
      </WasmLoader>
    </div>
  )
}

export default App;
