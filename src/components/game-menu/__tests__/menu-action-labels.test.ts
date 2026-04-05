import { describe, expect, it } from "vitest";
import { getMenuActionLabel } from "../menu-action-labels";

describe("getMenuActionLabel", () => {
  it("keeps the main menu title in English", () => {
    expect(getMenuActionLabel("game.startGame", "th").title).toBe("Start Game");
    expect(getMenuActionLabel("game.settings", "zh-CN").title).toBe("Settings");
  });

  it("adds the selected gameplay language as a subtitle", () => {
    expect(getMenuActionLabel("game.exit", "th")).toEqual({
      title: "Exit",
      subtitle: "ออก",
    });
    expect(getMenuActionLabel("game.levelSelect", "zh-CN")).toEqual({
      title: "Level Select",
      subtitle: "关卡选择",
    });
  });

  it("omits the subtitle when gameplay stays in English", () => {
    expect(getMenuActionLabel("game.playAllLevels", "en")).toEqual({
      title: "Challenge Mode",
      subtitle: undefined,
    });
  });

  it("uses Challenge Mode wording for localized gameplay subtitles", () => {
    expect(getMenuActionLabel("game.playAllLevels", "th")).toEqual({
      title: "Challenge Mode",
      subtitle: "โหมดชาเลนจ์",
    });
    expect(getMenuActionLabel("game.playAllLevels", "fr")).toEqual({
      title: "Challenge Mode",
      subtitle: "Mode Défi",
    });
  });
});
