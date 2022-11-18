import fs from "fs/promises";
import path from "path";
import {flatten} from "lodash";

type ReconstructionJson = {
    entities: {
        [name: string]: {
            type: "Sketch" | "Extrude",
            profiles: {
                [name: string]: {
                    loops: [
                        {
                            profile_curves: Curve[],
                        }   
                    ]
                }
            }
        }
    }
}

type Curve = Line3D | Arc3D | Circle3D;

type Line3D = {
    type: "Line3D",
    start_point: {
        x: number,
        y: number,
        z: number,
    },
    end_point: {
        x: number,
        y: number,
        z: number,
    }
}

type Arc3D = {
    type: "Arc3D",
    start_point: {
        x: number,
        y: number,
        z: number,
    },
    end_point: {
        x: number,
        y: number,
        z: number,
    },
    center_point: {
        x: number,
        y: number,
        z: number,
    },
    radius: number,
    start_angle: number,
    end_angle: number,
}

type Circle3D = {
    type: "Circle3D",
    center_point: {
        x: number,
        y: number,
        z: number,
    },
    radius: number,
}

export interface ArcCommand {
    x: number;
    y: number;
    r: number;
    s: number;
    e: number
}

export interface LineCommand {
    x0: number;
    y0: number;
    x: number;
    y: number;
}

export interface ArcCommandEndPointRep {
    x0: number,
    y0: number,
    rx: number,
    ry: number,
    largeArc: 0 | 1,
    sweep: 0 | 1,
    x: number,
    y: number,
    xAxisRotation: number
}

const readDirectory = async (dir: string) => {
  const files = await (await fs.readdir(dir)).filter(path => path.includes(".json"));

  const values = files.flatMap(async (file) => {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      return;
    }
    const content = await fs.readFile(filePath);
    return content;
  }) as Array<Promise<Buffer>>;

  const buffers: Buffer[] = [];
  for(const [i, value] of values.entries()) {
    //console.log(i);
    buffers.push(await value);
  }
  // Remove this line to keep the raw buffers
  const contents = buffers.filter(Boolean).map((l) => l.toString());
  return contents;
};

async function run() {
    console.log("READING FILES");
    const contents = await readDirectory("./r1.0.1/reconstruction"); 
    //console.log(contents.length);
    console.log("PARSING JSONS");
    const jsons = contents.map(str => JSON.parse(str)) as ReconstructionJson[];
    //console.log(jsons[0]);
    console.log("LOADING SKETCHES");
    const sketches = flatten(jsons.map(json => Object.values(json.entities))).filter(e => e.type === "Sketch" && e.profiles);
    const svgs: string[] = [];
    for(const [i, sketch] of sketches.entries()) {
        console.log("processing " + i + "/" + sketches.length);
        const profiles = Object.values(sketch.profiles);
        const loops = flatten(profiles.map(p => p.loops));
        const loop_curves = loops.map(loop => loop.profile_curves);
        if(loop_curves.some(curves => curves.some(c => !["Line3D", "Arc3D", "Circle3D"].includes(c.type)))) continue;
        const loop_commands = loop_curves.map(curves => flatten(curves.map(curve => curveToSvgCommand(curve))));
        const loop_paths = loop_commands.map(commands => commandsToPath(commands));
        const loop_path_tags = loop_paths.map(path => "<path d='" + path + "'/>");
        const svg = "<svg version='1.1' x='0px' y='0px' viewBox='-10 -10 20 20' xmlns='http://www.w3.org/2000/svg'>" +
                        "<style>path{stroke:black; stroke-width: 0.1; fill: transparent}</style>" +
                        loop_path_tags.join("\n") +
                    "</svg>";
        const browserProofSvg = browserProveSvgXml(svg);
        svgs.push(browserProofSvg);
    }
    for(const [i, svg] of svgs.entries()) {
        console.log("writing " + i + "/" + svgs.length);
        await fs.writeFile("./output/" + i + ".svg", svg);
    }
}

function browserProveSvgXml(xml: string): string {
    xml = xml.replace(/xmlns\=\"\"/g, "");
    if(!xml.includes("xmlns")) {
      xml = xml.substring(0, 5) + "xmlns=\"http://www.w3.org/2000/svg\" " + xml.substring(5)
    }
    return xml;
  }

function curveToSvgCommand(curve: Curve): (LineCommand | ArcCommand)[] {
    if(curve.type === "Line3D") {
        return [{
            x0: curve.start_point.x,
            y0: curve.start_point.y,
            x: curve.end_point.x,
            y: curve.end_point.y,
        }]
    }
    if(curve.type === "Arc3D") {
        return [{
            x: curve.center_point.x,
            y: curve.center_point.y,
            r: curve.radius,
            s: curve.start_angle,
            e: curve.end_angle,
        }]
    }
    if(curve.type === "Circle3D") {
        return [
            {
                x: curve.center_point.x,
                y: curve.center_point.y,
                r: curve.radius,
                s: 0,
                e: Math.PI,
            },
            {
                x: curve.center_point.x,
                y: curve.center_point.y,
                r: curve.radius,
                s: Math.PI,
                e: Math.PI * 2,
            },
        ]

    }
    return [];
}

function commandsToPath(data: (ArcCommand | ArcCommandEndPointRep | LineCommand)[]): string {
    let result = "";
    const firstCommand = _ensureEndPointRep(data[0]);
    result += "M" + firstCommand.x0 + "," + firstCommand.y0 + ",";
    data.forEach(cmd => {
        const eCmd = _ensureEndPointRep(cmd);
        if(isLine(eCmd)) {
            result += "L" + eCmd.x + "," + eCmd.y + ",";
        } else {
            const aCmd = eCmd as ArcCommandEndPointRep;
            result += "A" + aCmd.rx + "," + aCmd.ry + "," + aCmd.xAxisRotation + "," + aCmd.largeArc + "," + aCmd.sweep + "," + aCmd.x + "," + aCmd.y + ",";
        }
    });
    result += "Z";
    return result;
}

function isLine(obj: ArcCommand | LineCommand | ArcCommandEndPointRep): obj is LineCommand {
    return 'x0' in obj && 'y0' in obj && 'x' in obj && 'y' in obj && !('sweep' in obj);
}

function isArc(obj: ArcCommand | LineCommand | ArcCommandEndPointRep): obj is ArcCommand {
    return 'x' in obj && 'y' in obj && 'r' in obj && 's' in obj && 'e' in obj;
}

function _ensureEndPointRep(cmd: ArcCommand | ArcCommandEndPointRep | LineCommand): ArcCommandEndPointRep | LineCommand {
    if(isArc(cmd)) {
        return _convertCenterRepToEndpointRep(cmd);
    } else {
        return cmd;
    }
}

// implemented from this approach: https://www.w3.org/TR/SVG/implnote.html#ArcConversionCenterToEndpoint
function _convertCenterRepToEndpointRep(arc: ArcCommand): ArcCommandEndPointRep {
    let phi = 0;
    let r = arc.r;
    let x = arc.x;
    let y = arc.y;
    let theta1 = arc.s;
    let theta2 = arc.e;
    let deltaTheta = theta2 - theta1;
    
    // first compute start point (x1, y1)
    // (equivalent to x0 and y0 in the SVG arc spec)
    let m1 = [[Math.cos(phi), -Math.sin(phi)], [Math.sin(phi), Math.cos(phi)]];
    let m2 = [[r*Math.cos(theta1)], [r*Math.sin(theta1)]];
    let m3 = [[x], [y]];
    let m4 = _multiplyMatrices(m1, m2);
    let x1y1 = _addMatrices(m4, m3);

    // then compute end point (x2, y2)
    // (equivalent to x and y in the SVG arc spec)
    let m5 = [[r*Math.cos(theta2)], [r*Math.sin(theta2)]];
    let m6 = _multiplyMatrices(m1, m5);
    let x2y2 = _addMatrices(m6, m3);

    // then compute the flags
    let largeArcFlag: 0 | 1 = Math.abs(deltaTheta) > Math.PI ? 1 : 0;
    let sweepFlag: 0 | 1 = deltaTheta > 0 ? 1 : 0;

    const result = {
        x0: x1y1[0][0],
        y0: x1y1[1][0],
        rx: r,
        ry: r,
        largeArc: largeArcFlag,
        sweep: sweepFlag,
        x: x2y2[0][0],
        y: x2y2[1][0],
        xAxisRotation: 0
    }
    return result;
}

function _addMatrices(m1: number[][], m2: number[][]): number[][] {
    let result: number[][] = [];
    for (let i = 0; i < m1.length; i++) {
        result.push([]);
        for (let j = 0; j < m1[i].length; j++) {
            result[i].push(m1[i][j] + m2[i][j]);
        }
    }
    return result;
}

function _multiplyMatrices(m1: number[][], m2: number[][]): number[][] {
    var result: number[][] = [];
    for (var i = 0; i < m1.length; i++) {
        result[i] = [];
        for (var j = 0; j < m2[0].length; j++) {
            var sum = 0;
            for (var k = 0; k < m1[0].length; k++) {
                sum += m1[i][k] * m2[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

run();