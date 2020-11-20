import React, { useEffect, useState } from "react";
import { MyTask, taskQueue } from "./example-qqueue";

export function UUID(prop: { id: number; color: string }) {
  const [uuid, setUuid] = useState("");
  const id = prop.id;

  useEffect(() => {
    const task = new MyTask(id, (r?: { id: number; uuid: string }) => {
      setUuid(r?.uuid ?? "oops");
    });
    taskQueue.enqueue(task);
  }, [id]);

  return (
    <div
      style={{
        height: 100,
        backgroundColor: prop.color,
        fontSize: "1.2em",
        color: "white",
        textAlign: "center",
        lineHeight: "100px",
      }}
    >
      {uuid}
    </div>
  );
}
