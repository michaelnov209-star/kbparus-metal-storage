export type TrainingPlacement = "top" | "right" | "bottom" | "left";

export type TrainingRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

export type TrainingSize = {
  width: number;
  height: number;
};

export type TrainingPopoverPosition = {
  top: number;
  left: number;
  placement: TrainingPlacement;
};

export type TrainingConnectorGeometry = {
  path: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

const VIEWPORT_MARGIN = 12;
// The connector needs its own visual lane. A 20–24px card gap leaves no room
// for a curved arrowhead and was the reason the first bottom-placed steps
// looked folded over themselves.
const POPOVER_GAP = 48;
const CONNECTOR_OUTSET = 4;
const ANCHOR_INSET = 32;

const placements: TrainingPlacement[] = [
  "top",
  "right",
  "bottom",
  "left"
];

function clamp(value: number, min: number, max: number) {
  if (max < min) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function requiredSpace(
  placement: TrainingPlacement,
  popover: TrainingSize
) {
  return (
    (placement === "left" || placement === "right"
      ? popover.width
      : popover.height) + POPOVER_GAP
  );
}

/**
 * Keeps the requested placement whenever it fits. If it cannot fit, chooses
 * the side with the greatest usable surplus instead of clamping the card over
 * the highlighted element.
 */
export function getTrainingPopoverPosition(
  target: TrainingRect,
  requested: TrainingPlacement,
  popover: TrainingSize,
  viewport: TrainingSize
): TrainingPopoverPosition {
  const spaces: Record<TrainingPlacement, number> = {
    top: target.top - VIEWPORT_MARGIN,
    right: viewport.width - target.right - VIEWPORT_MARGIN,
    bottom: viewport.height - target.bottom - VIEWPORT_MARGIN,
    left: target.left - VIEWPORT_MARGIN
  };

  const fits = (placement: TrainingPlacement) =>
    spaces[placement] >= requiredSpace(placement, popover);

  let placement = requested;

  if (!fits(requested)) {
    const fittingPlacements = placements.filter(fits);

    if (fittingPlacements.length > 0) {
      placement = [...fittingPlacements].sort(
        (a, b) =>
          spaces[b] -
          requiredSpace(b, popover) -
          (spaces[a] - requiredSpace(a, popover))
      )[0];
    } else {
      placement = [...placements].sort(
        (a, b) =>
          spaces[b] / requiredSpace(b, popover) -
          spaces[a] / requiredSpace(a, popover)
      )[0];
    }
  }

  const maxLeft = Math.max(
    VIEWPORT_MARGIN,
    viewport.width - popover.width - VIEWPORT_MARGIN
  );
  const maxTop = Math.max(
    VIEWPORT_MARGIN,
    viewport.height - popover.height - VIEWPORT_MARGIN
  );

  if (placement === "right") {
    return {
      top: clamp(
        target.top + target.height / 2 - popover.height / 2,
        VIEWPORT_MARGIN,
        maxTop
      ),
      left: clamp(
        target.right + POPOVER_GAP,
        VIEWPORT_MARGIN,
        maxLeft
      ),
      placement
    };
  }

  if (placement === "left") {
    return {
      top: clamp(
        target.top + target.height / 2 - popover.height / 2,
        VIEWPORT_MARGIN,
        maxTop
      ),
      left: clamp(
        target.left - popover.width - POPOVER_GAP,
        VIEWPORT_MARGIN,
        maxLeft
      ),
      placement
    };
  }

  if (placement === "top") {
    return {
      top: clamp(
        target.top - popover.height - POPOVER_GAP,
        VIEWPORT_MARGIN,
        maxTop
      ),
      left: clamp(
        target.left + target.width / 2 - popover.width / 2,
        VIEWPORT_MARGIN,
        maxLeft
      ),
      placement
    };
  }

  return {
    top: clamp(
      target.bottom + POPOVER_GAP,
      VIEWPORT_MARGIN,
      maxTop
    ),
    left: clamp(
      target.left + target.width / 2 - popover.width / 2,
      VIEWPORT_MARGIN,
      maxLeft
    ),
    placement
  };
}

function anchorRange(start: number, size: number) {
  const inset = Math.min(ANCHOR_INSET, size / 3);
  return {
    min: start + inset,
    max: start + size - inset
  };
}

/**
 * Connects the closest outer edges of the popover and spotlight. The endpoint
 * deliberately stays outside the highlighted content; this prevents the line
 * and arrowhead from crossing labels and controls.
 */
export function getTrainingConnectorGeometry(
  target: TrainingRect,
  position: TrainingPopoverPosition,
  popover: TrainingSize,
  viewport: TrainingSize
): TrainingConnectorGeometry | null {
  const card: TrainingRect = {
    top: position.top,
    left: position.left,
    width: popover.width,
    height: popover.height,
    right: position.left + popover.width,
    bottom: position.top + popover.height
  };

  const targetX = target.left + target.width / 2;
  const targetY = target.top + target.height / 2;
  const cardX = card.left + card.width / 2;
  const cardY = card.top + card.height / 2;
  const cardXRange = anchorRange(card.left, card.width);
  const cardYRange = anchorRange(card.top, card.height);
  const targetXRange = anchorRange(target.left, target.width);
  const targetYRange = anchorRange(target.top, target.height);

  let start = { x: cardX, y: cardY };
  let end = { x: targetX, y: targetY };
  let axis: "horizontal" | "vertical";
  let direction: 1 | -1;
  let separation: number;

  if (position.placement === "bottom") {
    const sharedX = clamp(
      (cardX + targetX) / 2,
      Math.max(cardXRange.min, targetXRange.min),
      Math.min(cardXRange.max, targetXRange.max)
    );
    start = {
      x: clamp(sharedX, cardXRange.min, cardXRange.max),
      y: card.top - CONNECTOR_OUTSET
    };
    end = {
      x: clamp(sharedX, targetXRange.min, targetXRange.max),
      y: target.bottom + CONNECTOR_OUTSET
    };
    axis = "vertical";
    direction = -1;
    separation = start.y - end.y;
  } else if (position.placement === "top") {
    const sharedX = clamp(
      (cardX + targetX) / 2,
      Math.max(cardXRange.min, targetXRange.min),
      Math.min(cardXRange.max, targetXRange.max)
    );
    start = {
      x: clamp(sharedX, cardXRange.min, cardXRange.max),
      y: card.bottom + CONNECTOR_OUTSET
    };
    end = {
      x: clamp(sharedX, targetXRange.min, targetXRange.max),
      y: target.top - CONNECTOR_OUTSET
    };
    axis = "vertical";
    direction = 1;
    separation = end.y - start.y;
  } else if (position.placement === "right") {
    const sharedY = clamp(
      (cardY + targetY) / 2,
      Math.max(cardYRange.min, targetYRange.min),
      Math.min(cardYRange.max, targetYRange.max)
    );
    start = {
      x: card.left - CONNECTOR_OUTSET,
      y: clamp(sharedY, cardYRange.min, cardYRange.max)
    };
    end = {
      x: target.right + CONNECTOR_OUTSET,
      y: clamp(sharedY, targetYRange.min, targetYRange.max)
    };
    axis = "horizontal";
    direction = -1;
    separation = start.x - end.x;
  } else {
    const sharedY = clamp(
      (cardY + targetY) / 2,
      Math.max(cardYRange.min, targetYRange.min),
      Math.min(cardYRange.max, targetYRange.max)
    );
    start = {
      x: card.right + CONNECTOR_OUTSET,
      y: clamp(sharedY, cardYRange.min, cardYRange.max)
    };
    end = {
      x: target.left - CONNECTOR_OUTSET,
      y: clamp(sharedY, targetYRange.min, targetYRange.max)
    };
    axis = "horizontal";
    direction = 1;
    separation = end.x - start.x;
  }

  // A clamped popover may overlap a very large spotlight. In that rare case a
  // connector would run through the UI, so the spotlight remains the cue.
  if (separation < 10) return null;

  const handle = clamp(separation * 0.42, 24, 104);
  const midpointX = (start.x + end.x) / 2;
  const midpointY = (start.y + end.y) / 2;

  if (axis === "vertical") {
    const naturalDelta = Math.abs(start.x - end.x);
    const bend =
      naturalDelta < 24
        ? clamp(separation * 0.12, 16, 38) *
          (midpointX > viewport.width / 2 ? -1 : 1)
        : 0;
    const control1 = {
      x: start.x + bend,
      y: start.y + direction * handle
    };
    const control2 = {
      x: end.x + bend,
      y: end.y - direction * handle
    };

    return {
      start,
      end,
      path: `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`
    };
  }

  const naturalDelta = Math.abs(start.y - end.y);
  const bend =
    naturalDelta < 24
      ? clamp(separation * 0.12, 16, 38) *
        (midpointY > viewport.height / 2 ? -1 : 1)
      : 0;
  const control1 = {
    x: start.x + direction * handle,
    y: start.y + bend
  };
  const control2 = {
    x: end.x - direction * handle,
    y: end.y + bend
  };

  return {
    start,
    end,
    path: `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`
  };
}
