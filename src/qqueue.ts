export interface ITask<T, R> {
  arg: T;
  callback(r?: R): void;
}

export interface ITaskQueue<T, R> {
  enqueue(task: ITask<T, R>): void;
  run(): void;
  stop(): void;
}

/**
 * 封装执行请求和分发结果逻辑
 */
export interface IExecutor<T, R> {
  /**
   * 请求数据
   * @param ts
   */
  doRequest(ts: T[]): Promise<{ ts: T[]; rs: R[] }>;
  /**
   * 对结果进行重排，然后返回
   * @param ts
   * @param rs
   * @returns 和ts: T[]同长度的数组，结果对号入座
   */
  reorderMap(ts: T[], rs: R[]): (R | undefined)[];
}

export enum QueueState {
  Initial,
  Running,
  Stopped,
}

/**
 * 任务调度。
 * 有两种调度触发机制，一个是等待队列达到设定的阈值，另一个是等待时间结束。
 */
export class TaskQueue<T, R> implements ITaskQueue<T, R> {
  constructor(threshold: number, idle: number, executor: IExecutor<T, R>) {
    this.threshold = threshold;
    this.idle = idle;
    this.executor = executor;
  }

  executor: IExecutor<T, R>;

  /**
   * 单调递增ID，用来协调两种触发机制
   */
  execID: number = 0;
  /**
   * 设定执行队列的大小，可调，下次调度生效
   */
  threshold: number;
  /**
   * 等待时间
   */
  idle: number;
  waitingQueue: ITask<T, R>[] = [];
  executingQueue: ITask<T, R>[] = [];
  state: QueueState = QueueState.Initial;

  /**
   * 把任务放入等待队列
   * @param task
   */
  enqueue(task: ITask<T, R>): void {
    if (this.state === QueueState.Running) {
      this.waitingQueue.push(task);
      console.log("入队", this.waitingQueue.length);
      if (this.waitingQueue.length >= this.threshold) {
        this.collect();
      }
    }
  }

  /**
   * 把等待队列中的任务放入执行队列，数量为min(threshold, watingQueue.length)
   * @param execID
   */
  collect(execID?: number): void {
    console.log("collect", execID, this.execID);
    if (execID === undefined || execID === this.execID) {
      if (this.executingQueue.length === 0) {
        this.execID++;
        const size = Math.min(this.threshold, this.waitingQueue.length);
        this.executingQueue = this.waitingQueue.splice(0, size);
        if (this.executingQueue.length || this.state === QueueState.Running) {
          this.execute();
        }
      } else if (execID === this.execID) {
        this.resetTimer();
      }
    }
  }

  /**
   * 从执行队列里收集参数并执行请求
   */
  execute(): void {
    this.resetTimer();
    this.executor
      .doRequest(this.executingQueue.map((it) => it.arg))
      .then(({ ts, rs }) => {
        this.dispatch(ts, rs);
      });
  }

  /**
   * 把请求响应结果分发到各个Task的回调中
   * @param ts
   * @param rs
   */
  dispatch(ts: T[], rs: R[]): void {
    const mrs = this.executor.reorderMap(ts, rs);
    if (mrs.length !== ts.length) {
      console.error("reorderMap应该返回和ts等长的数组");
    } else {
      this.executingQueue.forEach((it, i) => {
        it.callback(mrs[i]);
      });
    }
    this.executingQueue = [];
  }

  resetTimer() {
    (function (idle, execID, collect) {
      setTimeout(() => {
        collect(execID);
      }, idle);
    })(this.idle, this.execID, this.collect.bind(this));
  }

  run(): void {
    if (this.state !== QueueState.Running) {
      this.state = QueueState.Running;
    }
    this.resetTimer();
  }

  stop() {
    this.state = QueueState.Stopped;
  }
}
