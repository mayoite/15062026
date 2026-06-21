import { useEffect, useMemo, useState } from 'react';
import { Canvas as FabricCanvas, Group } from 'fabric';
import { FURNISHINGS } from '../models/furnishings';
import { createShape, RL_FILL, RL_STROKE } from '../lib/helpers';
import { ZoomControl } from './ZoomControl';

const WIDTH = 1100;
const HEIGHT = 400;

type ChairsLayoutDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (layout: any) => void;
};

type RectForm = {
  chair: number;
  rows: number;
  sections: number;
  chairs: number;
  spacing_chair: number;
  spacing_row: number;
  spacing_sections: number[];
};

type CurvedForm = {
  chair: number;
  radius: number;
  angle: number;
  rows: number;
  spacing_row: number;
  chairs: number[];
};

const toRadians = (angle: number) => angle * (Math.PI / 180);

export function ChairsLayoutDialog({ open, onClose, onCreate }: ChairsLayoutDialogProps) {
  const [layoutOption, setLayoutOption] = useState<'NORMAL' | 'CURVED'>('NORMAL');
  const [zoom, setZoom] = useState(100);
  const [view, setView] = useState<any>(null);
  const [layout, setLayout] = useState<any>(null);

  const [rectBlock, setRectBlock] = useState<RectForm>({
    chair: 0,
    rows: 1,
    sections: 1,
    chairs: 12,
    spacing_chair: 0,
    spacing_row: 22,
    spacing_sections: [5, 5, 5, 5],
  });

  const [curvedBlock, setCurvedBlock] = useState<CurvedForm>({
    chair: 0,
    radius: 200,
    angle: 180,
    rows: 1,
    spacing_row: 40,
    chairs: Array(10).fill(10),
  });

  const chairs = FURNISHINGS.chairs;

  useEffect(() => {
    if (!open) return;
    const canvas = new FabricCanvas('layout_chairs');
    canvas.setDimensions({ width: WIDTH, height: HEIGHT });
    setView(canvas);
    return () => {
      canvas.dispose();
      setView(null);
      setLayout(null);
    };
  }, [open]);

  const changeLayout = useMemo(
    () => () => {
      if (!view) return;
      const chrs: any[] = [];

      if (layoutOption === 'CURVED') {
        const { radius, angle, rows, chair, spacing_row, chairs: rowChairs } = curvedBlock;
        const start = -(angle / 2);
        for (let r = 0; r < rows; r++) {
          const n = rowChairs[r];
          const a = angle / n;
          const rad = radius + r * spacing_row;
          for (let i = 0; i <= n; i += 1) {
            const ca = start + i * a;
            const chr = createShape(chairs[chair], RL_STROKE, RL_FILL);
            chr.angle = ca;
            const x = Math.sin(toRadians(ca)) * rad;
            const y = Math.cos(toRadians(ca)) * rad;
            chr.left = x;
            chr.top = -y;
            chr.angle += 180;
            chrs.push(chr);
          }
        }
      } else {
        const { rows, sections, chairs: perRow, spacing_chair, spacing_row, chair } = rectBlock;
        const total = rows * perRow;
        const cps = Math.floor(perRow / sections);
        let x = 0;
        let y = 0;

        for (let i = 1; i <= total; i++) {
          const chr = createShape(chairs[chair], RL_STROKE, RL_FILL);
          chr.left = x;
          chr.top = y;

          if (i % perRow === 0) {
            y += spacing_row + chr.height!;
            x = 0;
          } else {
            x += chr.width! + spacing_chair;
            const s = Math.floor((i % perRow) / cps);
            if (i % perRow % cps === 0 && s + 1 <= sections) {
              x += rectBlock.spacing_sections[s - 1];
            }
          }
          chrs.push(chr);
        }
      }

      view.clear();
      const nextLayout = new Group(chrs, {
        originX: 'center',
        originY: 'center',
        left: WIDTH / 2,
        top: HEIGHT / 2,
        selectable: false,
        hasControls: false,
      });
      nextLayout.set('name', 'BLOCK:Chairs');
      nextLayout.scale(zoom / 100);
      view.add(nextLayout);
      view.renderAll();
      setLayout(nextLayout);
    },
    [view, layoutOption, rectBlock, curvedBlock, zoom, chairs],
  );

  useEffect(() => {
    if (open && view) changeLayout();
  }, [open, view, changeLayout]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog chairs-layout">
        <div className="layout-type">
          <label>
            <input
              type="radio"
              checked={layoutOption === 'NORMAL'}
              onChange={() => setLayoutOption('NORMAL')}
            />
            Normal
          </label>
          <label>
            <input
              type="radio"
              checked={layoutOption === 'CURVED'}
              onChange={() => setLayoutOption('CURVED')}
            />
            Curved
          </label>
          <ZoomControl zoom={zoom} onZoomChange={setZoom} />
        </div>

        {layoutOption === 'CURVED' ? (
          <div className="layout-form">
            <label>
              Chair
              <select
                value={curvedBlock.chair}
                onChange={(e) => setCurvedBlock((b) => ({ ...b, chair: Number(e.target.value) }))}
              >
                {chairs.map((c, i) => (
                  <option key={c.title} value={i}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Rows
              <input
                type="number"
                min={1}
                max={5}
                value={curvedBlock.rows}
                onChange={(e) => setCurvedBlock((b) => ({ ...b, rows: Number(e.target.value) }))}
              />
            </label>
            <label>
              Radius
              <input
                type="number"
                value={curvedBlock.radius}
                onChange={(e) => setCurvedBlock((b) => ({ ...b, radius: Number(e.target.value) }))}
              />
            </label>
            <label>
              Angle
              <input
                type="number"
                value={curvedBlock.angle}
                onChange={(e) => setCurvedBlock((b) => ({ ...b, angle: Number(e.target.value) }))}
              />
            </label>
            <label>
              Row spacing
              <input
                type="number"
                value={curvedBlock.spacing_row}
                onChange={(e) => setCurvedBlock((b) => ({ ...b, spacing_row: Number(e.target.value) }))}
              />
            </label>
            {curvedBlock.chairs.slice(0, curvedBlock.rows).map((n, i) => (
              <label key={i}>
                Chairs row {i + 1}
                <input
                  type="number"
                  value={n}
                  onChange={(e) => {
                    const next = [...curvedBlock.chairs];
                    next[i] = Number(e.target.value);
                    setCurvedBlock((b) => ({ ...b, chairs: next }));
                  }}
                />
              </label>
            ))}
          </div>
        ) : (
          <div className="layout-form">
            <label>
              Chair
              <select
                value={rectBlock.chair}
                onChange={(e) => setRectBlock((b) => ({ ...b, chair: Number(e.target.value) }))}
              >
                {chairs.map((c, i) => (
                  <option key={c.title} value={i}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sections
              <select
                value={rectBlock.sections}
                onChange={(e) => setRectBlock((b) => ({ ...b, sections: Number(e.target.value) }))}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Rows
              <input
                type="number"
                value={rectBlock.rows}
                onChange={(e) => setRectBlock((b) => ({ ...b, rows: Number(e.target.value) }))}
              />
            </label>
            <label>
              Chairs per row
              <input
                type="number"
                value={rectBlock.chairs}
                onChange={(e) => setRectBlock((b) => ({ ...b, chairs: Number(e.target.value) }))}
              />
            </label>
            <label>
              Chair spacing
              <input
                type="number"
                value={rectBlock.spacing_chair}
                onChange={(e) => setRectBlock((b) => ({ ...b, spacing_chair: Number(e.target.value) }))}
              />
            </label>
            <label>
              Row spacing
              <input
                type="number"
                value={rectBlock.spacing_row}
                onChange={(e) => setRectBlock((b) => ({ ...b, spacing_row: Number(e.target.value) }))}
              />
            </label>
            {rectBlock.sections > 1 &&
              rectBlock.spacing_sections.slice(0, rectBlock.sections - 1).map((n, i) => (
                <label key={i}>
                  Section gap {i + 1}
                  <input
                    type="number"
                    value={n}
                    onChange={(e) => {
                      const next = [...rectBlock.spacing_sections];
                      next[i] = Number(e.target.value);
                      setRectBlock((b) => ({ ...b, spacing_sections: next }));
                    }}
                  />
                </label>
              ))}
          </div>
        )}

        <canvas id="layout_chairs" />

        <div className="dialog-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (!layout) return;
              layout.selectable = true;
              layout.scale(1);
              onCreate(layout);
              onClose();
            }}
          >
            Create
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}