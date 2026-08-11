import { expect, test as base } from "@playwright/test";

import { AudioMock } from "./audio-mock";
import { GamePage } from "./game-page";

export const test = base.extend<{
  gamePage: GamePage;
  audioMock: AudioMock;
}>({
  gamePage: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(new GamePage(page));
  },
  audioMock: async ({ page }, use) => {
    const audioMock = new AudioMock(page);
    await audioMock.setup();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(audioMock);
  },
});

export { expect };
export { clickMovingElement, scaleTimeout, waitForBrowserDelay } from "./browser-helpers";
export { GamePage } from "./game-page";
export { GameMenuPage } from "./game-menu-page";
export { GameplayPage } from "./gameplay-page";
export { AudioMock } from "./audio-mock";
export { simulateTap } from "./touch";
