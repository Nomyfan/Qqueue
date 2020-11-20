import React from "react";
import "./App.css";
import { taskQueue } from "./example-qqueue";
import { UUID } from "./UUID";

taskQueue.run();

function App() {
  const colors = [
    "red",
    "aqua",
    "green",
    "blueviolet",
    "orange",
    "darkcyan",
    "lightskyblue",
    "brown",
    "hotpink",
  ];

  return (
    <div className="App">
      {colors.map((color, i) => (
        <UUID key={i} id={i} color={color} />
      ))}
    </div>
  );
}

export default App;
