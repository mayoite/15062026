import {
  Group,
  Rect,
  Line,
  Circle,
  Ellipse,
  Path,
  Polygon,
  Polyline,
  Triangle,
  IText,
  Point,
  util,
} from 'fabric';

const
  RL_FILL = '#FFF',
  RL_STROKE = '#000',
  RL_PREVIEW_WIDTH = 140,
  RL_PREVIEW_HEIGHT = 120,
  RL_CHAIR_STROKE = '#999',
  RL_CHAIR_FILL = '#FFF',
  RL_CHAIR_TUCK = 6,
  RL_VIEW_WIDTH = 120,
  RL_VIEW_HEIGHT = 56,
  RL_FOOT = 12,
  RL_AISLEGAP = 12 * 3,
  RL_ROOM_OUTER_SPACING = 48,
  RL_ROOM_INNER_SPACING = 4,
  RL_ROOM_STROKE = '#000',
  RL_CORNER_FILL = '#88f',
  RL_UNGROUPABLES = ['CHAIR', 'MISCELLANEOUS', 'DOOR'],
  RL_CREDIT_TEXT = 'Created By https://github.com/ilhccc',
  RL_CREDIT_TEXT_PARAMS = { fontSize: 12, fontFamily: 'Arial', fill: '#999', left: 12 };


const createText = (properties: any) => {
  let { text } = properties;
  if (properties.direction === 'VERTICAL') {
    const chars = [];
    for (const char of text) {
      chars.push(char);
    }
    text = chars.join('\n');
  }

  const textObj = new IText(text, {
    fontSize: properties.font_size,
    lineHeight: 0.8,
    hasControls: false
  }) as IText & { name?: string };
  (textObj as any).name = properties.name;
  return textObj;
};


/** Create Basic Shape  */
const createBasicShape = (part: any, stroke: string = '#aaaaaa', fill: string = 'white') => {
  if (part.definition.fill == null)
    part.definition.fill = fill;

  if (part.definition.stroke == null)
    part.definition.stroke = stroke;
  else if (part.definition.stroke == 'chair')
    part.definition.stroke = RL_CHAIR_STROKE;

  let fObj;

  switch (part.type) {
    case 'circle':
      fObj = new Circle(part.definition);
      break;
    case 'ellipse':
      fObj = new Ellipse(part.definition);
      break;
    case 'line':
      fObj = new Line(part.line, part.definition);
      break;
    case 'path':
      fObj = new Path(part.path, part.definition);
      break;
    case 'polygon':
      fObj = new Polygon(part.definition);
      break;
    case 'polyline':
      fObj = new Polyline(part.definition);
      break;
    case 'rect':
      fObj = new Rect(part.definition);
      break;
    case 'triangle':
      fObj = new Triangle(part.definition);
      break;
  }

  return (fObj);
};


const createFurniture = (type: string, object: any, chair: any = {}) => {
  if (type === 'TABLE') {
    return createTable(object, chair);
  } else if (type === 'TEXT') {
    return createText(object);
  } else if (type === 'LAYOUT') {
    return object;
  } else if (type === 'GENERIC' || type === 'MISC' || type === 'FURNITURE') {
    // Support for main catalog items in the replacement (simple rect, no chairs)
    return createGenericFurniture(object);
  } else {
    return createShape(object, RL_STROKE, RL_FILL, type);
  }
};

// Generic rect support for swapping in main Oando catalog items (title + width/height in fabric units)
const createGenericFurniture = (object: any) => {
  const w = object.width || 60;
  const h = object.height || 50;
  const rect = new Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill: '#e8d4b8',
    stroke: '#5c4630',
    strokeWidth: 2,
    originX: 'center',
    originY: 'center',
  });
  const group = new Group([rect], {
    hasControls: true,
    originX: 'center',
    originY: 'center',
  }) as Group & { name?: string };
  (group as any).name = `GENERIC:${object.title || 'Item'}`;
  return group;
};

/** Adding Chairs */
const createShape = (object: any, stroke = RL_CHAIR_STROKE, fill = RL_CHAIR_FILL, type: string = 'CHAIR'): Group => {
  const parts = object.parts.map((obj: any) => createBasicShape(obj, stroke, fill));
  const group = new Group(parts, {
    hasControls: false,
    originX: 'center',
    originY: 'center'
  }) as Group & { name?: string };
  (group as any).name = `${type}:${object.title}`;

  return group;
};


// All Create[Name]Object() functions should return a group

const createTable = (def: any, RL_DEFAULT_CHAIR: any, type: string = 'TABLE') => {
  // tables with chairs have the chairs full-height around the table

  const components = [];
  let index = 0;

  // Note that we're using the provided width and height for table placement
  // Issues may arise if rendered shape is larger/smaller, since it's positioned from center point
  const chairWidth = RL_DEFAULT_CHAIR.width;
  const chairHeight = RL_DEFAULT_CHAIR.height;
  const tableLeft = def.leftChairs > 0 ? (chairHeight - RL_CHAIR_TUCK) : 0;
  const tableTop = (chairHeight - RL_CHAIR_TUCK);

  if (def.shape == 'circle') {

    const origin_x = def.width / 2 + chairHeight - RL_CHAIR_TUCK;
    const origin_y = def.width / 2 + chairHeight - RL_CHAIR_TUCK;
    const x2 = origin_x;
    const y2 = 0 + chairHeight / 2;

    const rotation_origin = new Point(origin_x, origin_y);

    const tableRadius = def.width / 2;
    const radius = def.width / 2 + chairHeight;   // outer radius of whole shape unit
    let angle = 0;
    const angleIncrement = 360 / (def.chairs > 0 ? def.chairs : 1);

    for (let x = 0; x < def.chairs; ++x) {
      // Note that width and height are the same for circle tables
      // width of whole area when done
      const width = def.width + chairHeight - (RL_CHAIR_TUCK * 2);

      components[index] = createShape(RL_DEFAULT_CHAIR, RL_CHAIR_STROKE, RL_CHAIR_FILL);

      const angle_radians = util.degreesToRadians(angle);
      const dx = x2 - rotation_origin.x;
      const dy = y2 - rotation_origin.y;
      const end = new Point(
        rotation_origin.x + dx * Math.cos(angle_radians) - dy * Math.sin(angle_radians),
        rotation_origin.y + dx * Math.sin(angle_radians) + dy * Math.cos(angle_radians)
      );
      components[index].left = end.x;
      components[index].top = end.y;
      components[index].angle = (angle + 180 > 360) ? (angle - 180) : (angle + 180);
      index++;
      angle += angleIncrement;
    }

    const tableCircle = {
      left: origin_x,
      top: origin_y,
      radius: tableRadius,
      fill: RL_FILL,
      stroke: RL_STROKE,
      originX: 'center',
      originY: 'center'
    } as any;
    components[index] = new Circle(tableCircle) as Circle & { name?: string };
    (components[index] as any).name = 'DESK';

  } else if (def.shape == 'rect') {
    const tableRect = {
      width: def.width,
      height: def.height,
      fill: RL_FILL,
      stroke: RL_STROKE
    } as any;

    // calculate gap between chairs, with extra for gap to end of table
    let gap = 0, firstOffset = 0, leftOffset = 0, topOffset = 0;

    // top chair row
    // Note that chairs 'look up' by default, so the bottom row isn't rotated
    // and the top row is.
    gap = (def.width - (def.topChairs * chairWidth)) / (def.topChairs + 1);
    firstOffset = gap + tableLeft;
    leftOffset = firstOffset;
    topOffset = 0;

    for (let x = 0; x < def.topChairs; x++) {
      components[index] = createShape(RL_DEFAULT_CHAIR, RL_CHAIR_STROKE, RL_CHAIR_FILL);
      components[index].angle = -180;
      components[index].left = leftOffset + chairWidth / 2;
      components[index].top = topOffset + chairHeight / 2;
      index++;

      leftOffset += (chairWidth + gap);
    }

    // bottom chair row
    gap = (def.width - (def.bottomChairs * chairWidth)) / (def.bottomChairs + 1);
    firstOffset = gap + tableLeft;
    leftOffset = firstOffset;
    topOffset = tableRect.height + chairHeight - (RL_CHAIR_TUCK * 2);

    for (let x = 0; x < def.bottomChairs; x++) {
      components[index] = createShape(RL_DEFAULT_CHAIR, RL_CHAIR_STROKE, RL_CHAIR_FILL);
      components[index].left = leftOffset + chairWidth / 2;
      components[index].top = topOffset + chairWidth / 2;
      ++index;

      leftOffset += (chairWidth + gap);
    }

    // left chair row
    gap = (def.height - (def.leftChairs * chairWidth)) / (def.leftChairs + 1);
    leftOffset = chairWidth / 2;
    topOffset = tableTop + gap + chairWidth / 2;  // top of table plus first gap, then to center

    for (let x = 0; x < def.leftChairs; x++) {
      components[index] = createShape(RL_DEFAULT_CHAIR, RL_CHAIR_STROKE, RL_CHAIR_FILL);
      components[index].angle = 90;
      components[index].left = leftOffset;
      components[index].top = topOffset;
      ++index;

      topOffset += (chairWidth + gap);
    }

    // right chair row
    gap = (def.height - (def.rightChairs * chairWidth)) / (def.rightChairs + 1);
    leftOffset = tableRect.width + chairWidth / 2;
    topOffset = tableTop + gap + chairWidth / 2;  // top of table plus first gap, then to center

    for (let x = 0; x < def.rightChairs; x++) {
      components[index] = createShape(RL_DEFAULT_CHAIR, RL_CHAIR_STROKE, RL_CHAIR_FILL);
      components[index].angle = -90;
      components[index].left = leftOffset + chairHeight - (RL_CHAIR_TUCK * 2);
      components[index].top = topOffset;
      ++index;

      topOffset += (chairWidth + gap);
    }

    // add table on top of chairs
    const rectObj = new Rect(tableRect) as Rect & { name?: string };
    (rectObj as any).name = 'DESK';
    components[index] = rectObj;
    components[index].left = tableLeft;
    components[index].top = tableTop;
  }

  const tableGroup = new Group(components, {
    left: 0,
    top: 0,
    hasControls: false,
    originX: 'center',
    originY: 'center'
  }) as Group & { name?: string };
  (tableGroup as any).name = `${type}:${def.title}`;

  return tableGroup;
};

export {
  createBasicShape,
  createTable,
  createShape,
  createText,
  createFurniture,

  RL_FILL,
  RL_STROKE,
  RL_CHAIR_STROKE,
  RL_CHAIR_FILL,
  RL_CHAIR_TUCK,
  RL_PREVIEW_HEIGHT,
  RL_PREVIEW_WIDTH,
  RL_VIEW_WIDTH,
  RL_VIEW_HEIGHT,
  RL_FOOT,
  RL_AISLEGAP,
  RL_ROOM_OUTER_SPACING,
  RL_ROOM_INNER_SPACING,
  RL_ROOM_STROKE,
  RL_CORNER_FILL,
  RL_UNGROUPABLES,
  RL_CREDIT_TEXT,
  RL_CREDIT_TEXT_PARAMS
};
