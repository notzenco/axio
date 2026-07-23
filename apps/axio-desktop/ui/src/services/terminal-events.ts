import { TerminalOutputRouter } from "../data/terminal-output";
import type { TerminalOutputEvent } from "../types";
import { listenTerminalOutput } from "./tauri";

const outputRouter = new TerminalOutputRouter();
const listenerReady = listenTerminalOutput((event) => outputRouter.dispatch(event));

export function subscribeTerminalOutput(
  sessionId: string,
  handler: (event: TerminalOutputEvent) => void,
) {
  const dispose = outputRouter.subscribe(sessionId, handler);
  return listenerReady.then(
    () => dispose,
    (error) => {
      dispose();
      throw error;
    },
  );
}
