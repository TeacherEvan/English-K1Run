import { expect, test as base } from "@playwright/test";

import { AudioMock } from "./audio-mock";
import { GamePage } from "./game-page";

export const test = base.extend<{
  gamePage: GamePage;
  audioMock: AudioMock;
}>({
  gamePage: async ({ page }, provideFixture) => {
    await provideFixture(new GamePage(page));
  },
  audioMock: async ({ page }, provideFixture) => {
    const audioMock = new AudioMock(page);
    await audioMock.setup();
    await provideFixture(audioMock);
  },
});

export { expect };

export { clickMovingElement, scaleTimeout, waitForBrowserDelay } from "./browser-helpers";
export { GamePage } from "./game-page";
export { GameMenuPage } from "./game-menu-page";
export { GameplayPage } from "./gameplay-page";
export { AudioMock } from "./audio-mock";
export { simulateTap } from "./touch";
