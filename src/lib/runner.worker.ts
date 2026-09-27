import { captureLogs, runJs } from "./runner";

self.onmessage = (e: MessageEvent) =>
  self.postMessage(e.data.tests ? runJs(e.data.code, e.data.tests) : captureLogs(e.data.code, e.data.call));
