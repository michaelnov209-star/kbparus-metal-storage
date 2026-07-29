import { describe, expect, it } from "vitest";

import {
  getTrainingConnectorGeometry,
  getTrainingPopoverPosition,
  type TrainingRect
} from "../app/(payload)/components/adminTrainingGeometry";

const viewport = { width: 1200, height: 800 };
const popover = { width: 390, height: 280 };

describe("admin training geometry", () => {
  it("points a bottom connector to the target edge instead of crossing its content", () => {
    const target: TrainingRect = {
      top: 100,
      left: 100,
      width: 400,
      height: 100,
      right: 500,
      bottom: 200
    };

    const connector = getTrainingConnectorGeometry(
      target,
      { top: 300, left: 105, placement: "bottom" },
      popover,
      viewport
    );

    expect(connector).not.toBeNull();
    expect(connector?.end.y).toBe(204);
    expect(connector?.end.y).toBeGreaterThan(target.bottom);
    expect(connector?.path).toContain(" C ");
    expect(connector?.path).not.toContain(" Q ");
  });

  it("chooses a side that actually fits when the requested side is too small", () => {
    const target: TrainingRect = {
      top: 500,
      left: 260,
      width: 520,
      height: 150,
      right: 780,
      bottom: 650
    };

    const position = getTrainingPopoverPosition(
      target,
      "bottom",
      popover,
      viewport
    );

    expect(position.placement).toBe("top");
    expect(position.top + popover.height).toBeLessThan(target.top);
  });

  it("does not draw a malformed connector through an overlapping card", () => {
    const target: TrainingRect = {
      top: 100,
      left: 100,
      width: 400,
      height: 100,
      right: 500,
      bottom: 200
    };

    const connector = getTrainingConnectorGeometry(
      target,
      { top: 190, left: 105, placement: "bottom" },
      popover,
      viewport
    );

    expect(connector).toBeNull();
  });

  it("anchors horizontal connectors outside both surfaces", () => {
    const target: TrainingRect = {
      top: 180,
      left: 100,
      width: 180,
      height: 180,
      right: 280,
      bottom: 360
    };

    const connector = getTrainingConnectorGeometry(
      target,
      { top: 120, left: 360, placement: "right" },
      popover,
      viewport
    );

    expect(connector).not.toBeNull();
    expect(connector?.start.x).toBeLessThan(360);
    expect(connector?.end.x).toBeGreaterThan(target.right);
  });
});
