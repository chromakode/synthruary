import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import classNames from "classnames";
import { clamp } from "lodash";
import styles from "../styles/Home.module.css";

let _ctx: AudioContext | undefined;
export function getAudioContext(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext();
  }
  return _ctx;
}

export function connect(...nodes: AudioNode[]) {
  let lastNode: AudioNode | undefined;
  for (const node of nodes) {
    if (lastNode) {
      lastNode.connect(node);
    }
    lastNode = node;
  }
}

export interface Synth {
  start(x: number, y: number): void;
  update(x: number, y: number): void;
  end(): void;
}

function posMouse(
  ev: React.MouseEvent<HTMLElement>,
  el: HTMLElement
): [number, number] {
  const box = el.getBoundingClientRect();
  const x = clamp((ev.clientX - box.left) / box.width, 0, 1);
  const y = clamp((ev.clientY - box.top) / box.height, 0, 1);
  return [x, y];
}

function posTouch(ev: React.TouchEvent<HTMLElement>): [number, number] {
  const box = ev.currentTarget.getBoundingClientRect();
  const x = clamp((ev.touches[0].clientX - box.left) / box.width, 0, 1);
  const y = clamp((ev.touches[0].clientY - box.top) / box.height, 0, 1);
  return [x, y];
}

export function SynthBox<S extends Synth, ST>({
  className,
  synth: SynthClass,
  updateState,
  children,
}: {
  className: string;
  synth: {
    new ({
      el,
      updateState,
    }: {
      el: HTMLElement;
      updateState?: (state: ST) => void;
    }): S;
  };
  updateState?: (state: ST) => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isActive, setActive] = useState(false);
  const synth = useRef<S>();

  const handleMouseDown = useCallback(
    (ev) => {
      if (!synth.current) {
        synth.current = new SynthClass({ el: ref.current!, updateState });
      }
      if (!isActive) {
        synth.current.start(...posMouse(ev, ref.current!));
        setActive(true);
      }
    },
    [isActive]
  );
  const handleMouseMove = useCallback(
    (ev) => {
      synth.current?.update(...posMouse(ev, ref.current!));
    },
    [isActive]
  );
  const handleMouseUp = useCallback((ev) => {
    synth.current?.end();
    setActive(false);
  }, []);

  const handleTouchStart = useCallback(
    (ev) => {
      if (!synth.current) {
        synth.current = new SynthClass({ el: ref.current!, updateState });
      }
      if (!isActive) {
        synth.current.start(...posTouch(ev));
        setActive(true);
      }
    },
    [isActive]
  );
  const handleTouchMove = useCallback(
    (ev) => {
      if (isActive) {
        synth.current?.update(...posTouch(ev));
      }
    },
    [isActive]
  );
  const handleTouchEnd = useCallback(
    (ev) => {
      if (isActive) {
        synth.current?.end();
        setActive(false);
      }
    },
    [isActive]
  );

  useEffect(() => {
    if (isActive) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isActive]);

  useEffect(() => {
    if (synth.current) {
      synth.current?.end();
      synth.current = new SynthClass({ el: ref.current!, updateState });
    }
    return () => {
      synth.current?.end();
    };
  }, [SynthClass]);

  return (
    <div
      ref={ref}
      className={classNames(className, { [styles.active]: isActive })}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
