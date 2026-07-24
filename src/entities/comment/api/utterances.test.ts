import { isUtterancesLoaded, updateUtterancesTheme } from "./utterances";

describe("Utterances iframe helpers", () => {
  it("only detects and updates an iframe owned by the supplied comment container", () => {
    const currentPostContainer = document.createElement("div");
    const stalePostFrame = document.createElement("iframe");
    stalePostFrame.className = "utterances-frame";

    document.body.append(stalePostFrame, currentPostContainer);

    expect(isUtterancesLoaded(currentPostContainer)).toBe(false);
    expect(updateUtterancesTheme(currentPostContainer, "github-dark")).toBe(false);
  });
});
