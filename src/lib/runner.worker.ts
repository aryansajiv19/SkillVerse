import { runJs } from "./runner";

self.onmessage = (e: MessageEvent) => self.postMessage(runJs(e.data.code, e.data.tests));
