import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MenuActionButtonContent } from "../MenuActionButtonContent";

describe("MenuActionButtonContent", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = "";
  });

  it("keeps long subtitles wrappable inside the action copy column", async () => {
    const longSubtitle =
      "ภาษาเมนูและปุ่มที่ยาวมากเป็นพิเศษสำหรับทดสอบการตัดบรรทัดและป้องกันการล้นของปุ่ม";

    await act(async () => {
      root.render(
        <div className="flex max-w-48">
          <MenuActionButtonContent
            icon={<span>icon</span>}
            title="Start Game"
            subtitle={longSubtitle}
          />
        </div>,
      );
    });

    const subtitle = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent === longSubtitle,
    );

    expect(subtitle).not.toBeUndefined();
    expect(subtitle?.className).toContain("min-w-0");
    expect(subtitle?.className).toContain("max-w-full");
    expect(subtitle?.className).toContain("wrap-anywhere");
    expect(subtitle?.className).toContain("whitespace-normal");
  });

  it("preserves wrapping classes when callers provide a custom subtitle class", async () => {
    const longSubtitle =
      "A very long translated subtitle that still needs to wrap when the menu passes custom typography classes";

    await act(async () => {
      root.render(
        <div className="flex max-w-48">
          <MenuActionButtonContent
            icon={<span>icon</span>}
            title="Start Game"
            subtitle={longSubtitle}
            subtitleClassName="text-sm font-medium text-white/78"
          />
        </div>,
      );
    });

    const subtitle = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent === longSubtitle,
    );

    expect(subtitle).not.toBeUndefined();
    expect(subtitle?.className).toContain("min-w-0");
    expect(subtitle?.className).toContain("max-w-full");
    expect(subtitle?.className).toContain("wrap-anywhere");
    expect(subtitle?.className).toContain("whitespace-normal");
    expect(subtitle?.className).toContain("text-sm");
    expect(subtitle?.className).toContain("font-medium");
  });
});