import {
  IExecutor,
  ITask,
  ITaskScheduler,
  TaskScheduler,
} from "./task-scheduler";

export class MyExecutor
  implements IExecutor<{ id: number }, { id: number; uuid: string }> {
  doRequest(
    ts: { id: number }[]
  ): Promise<{ ts: { id: number }[]; rs: { id: number; uuid: string }[] }> {
    console.log("开始请求数据");
    return new Promise((res) => {
      setTimeout(() => {
        const rs = ts.map((t) => ({ id: t.id, uuid: `UUID-${t.id}` }));
        console.log("请求结束");
        res({ ts, rs });
      }, 1000);
    });
  }
  reorderMap(
    ts: { id: number }[],
    rs: { id: number; uuid: string }[]
  ): ({ id: number; uuid: string } | undefined)[] {
    const mapper = rs.reduce((m, v) => {
      m[v.id] = v;
      return m;
    }, {} as any);

    return ts.map((t) => mapper[t.id]);
  }
}

export class MyTask
  implements ITask<{ id: number }, { id: number; uuid: string }> {
  constructor(id: number, apply: (r?: { id: number; uuid: string }) => void) {
    this.arg = { id };
    this.apply = apply;
  }
  arg: { id: number };
  apply: (r?: { id: number; uuid: string }) => void;

  callback(r?: { id: number; uuid: string }): void {
    this.apply(r);
  }
}

export const scheduler = new TaskScheduler(
  3,
  1000,
  new MyExecutor()
) as ITaskScheduler<{ id: number }, { id: number; uuid: string }>;
