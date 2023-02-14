const controls = {
    speed: 1,
    noiseScale: 0.02,
    lineLength: 24,
    lineLengthSpeed: 0.1,
    baseDensity: 85,
    densityShiftSpeed: 0.05,
    densityShiftAmplitude: 5,
    cancerQuotient: 0.05
}

const jsonLD = document.querySelector('[type="application/ld+json"]');

if (jsonLD) {
    const cyrb53 = (str, seed = 0) => {
        let h1 = 0xdeadbeef ^ seed,
            h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }

        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    };


    function constrain(n, low, high) {
        return Math.max(Math.min(n, high), low);
    };

    function map(n, start1, stop1, start2, stop2, withinBounds) {
        const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
        if (!withinBounds) {
            return newval;
        }
        if (start2 < stop2) {
            return constrain(newval, start2, stop2);
        } else {
            return constrain(newval, stop2, start2);
        }
    };

    const data = JSON.parse(jsonLD.textContent);

    /// speed ////
    const speedInfluence = (data.satNumber / 2100000000000000);

    function easeInCirc(x) {
        return 1 - Math.sqrt(1 - Math.pow(x, 2));
    }

    controls.speed = map(easeInCirc(speedInfluence), 0, 1, 0, 14)
    /////////////////////


    // /// rarity ////
    // const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']

    // const rarity = rarities.findIndex(r => r == data.rarity)

    // controls.baseDensity = map(rarity, 5, 0, 35, 70);
    // ///////



    /// percentile ////
    const percentile = parseFloat(data.percentile) / 100;
    controls.lineLength = map(easeInCirc(percentile), 1, 0, 32, 60);
    ///////

    const hash = cyrb53(jsonLD.textContent) / 2 ^ 53;
    controls.baseDensity = map(hash, 0, 1, 35, 70)
}


if (true /* gui */) {
    function copy(input) {
        const temp = document.createElement('input');
        document.body.append(temp)
        temp.value = input

        temp.select();
        document.execCommand("copy");

        temp.remove();
    }


    const ranges = Object.keys(controls).reduce((acc, key) => {
        acc[key] = {
            min: 0,
            max: 1
        }

        return acc;
    }, {})


    function applySave(key, controlAndRange) {
        controls[key] = controlAndRange.control
        ranges[key] = controlAndRange.range
    }



    const savedControls = localStorage.getItem('saves')

    if (savedControls) {
        const parsed = JSON.parse(savedControls);

        if (parsed.window) {
            Object.keys(parsed.window).forEach(key => {
                applySave(key, parsed.window[key])
            })
        }
    }

    const savedRanges = localStorage.getItem('ranges')

    if (savedRanges) {
        const parsed = JSON.parse(savedRanges);
        applyRanges(parsed)
    }

    const gui = new dat.GUI();


    function saveWindow() {
        const saved = localStorage.getItem('saves');
        const parsedSave = JSON.parse(saved || '{}')
        parsedSave.window = Object.keys(controls).reduce((acc, key) => {
            acc[key] = {
                control: controls[key],
                range: ranges[key]
            }

            return acc;

        }, {})

        localStorage.setItem('saves', JSON.stringify(parsedSave))
    }

    Object.keys(controls).forEach(key => {
        const folder = gui.addFolder(key);

        const controller = folder.add(controls, key, ranges[key].min, ranges[key].max).onFinishChange(() => {
            saveWindow();
        })

        folder.add(ranges[key], 'min').onFinishChange(() => {
            controller.min(ranges[key].min)
            controller.updateDisplay()
            saveWindow();

        })
        folder.add(ranges[key], 'max').onFinishChange(() => {
            controller.max(ranges[key].max)
            controller.updateDisplay()

            saveWindow();
        })

    })


    var adjective = ["Excited", "Anxious", "Overweight", "Demonic", "Jumpy", "Misunderstood", "Squashed", "Gargantuan", "Broad", "Crooked", "Curved", "Deep", "Even", "Excited", "Anxious", "Overweight", "Demonic", "Jumpy", "Misunderstood", "Squashed", "Gargantuan", "Broad", "Crooked", "Curved", "Deep", "Even", "Flat", "Hilly", "Jagged", "Round", "Shallow", "Square", "Steep", "Straight", "Thick", "Thin", "Cooing", "Deafening", "Faint", "Harsh", "High-pitched", "Hissing", "Hushed", "Husky", "Loud", "Melodic", "Moaning", "Mute", "Noisy", "Purring", "Quiet", "Raspy", "Screeching", "Shrill", "Silent", "Soft", "Squeaky", "Squealing", "Thundering", "Voiceless", "Whispering"]
    var object = ["Taco", "Operating System", "Sphere", "Watermelon", "Cheeseburger", "Apple Pie", "Spider", "Dragon", "Remote Control", "Soda", "Barbie Doll", "Watch", "Purple Pen", "Dollar Bill", "Stuffed Animal", "Hair Clip", "Sunglasses", "T-shirt", "Purse", "Towel", "Hat", "Camera", "Hand Sanitizer Bottle", "Photo", "Dog Bone", "Hair Brush", "Birthday Card"]
    var list;

    function generator() {
        return adjective[Math.floor(Math.random() * adjective.length)] + " " + object[Math.floor(Math.random() * object.length)];;;
    }

    const copyObj = {
        save: () => {
            const id = generator();

            const saved = localStorage.getItem('saves');
            const parsedSave = JSON.parse(saved || '{}')
            parsedSave[id] = Object.keys(controls).reduce((acc, key) => {
                acc[key] = {
                    control: controls[key],
                    range: ranges[key]
                }

                return acc;
            }, {});

            localStorage.setItem('saves', JSON.stringify(parsedSave))

            const temp = {}
            temp[id] = () => {
                Object.keys(controls).forEach(key => {
                    if (key in parsedSave[id]) {
                        applySave(key, parsedSave[id][key])
                    }
                })
            };

            gui.add(temp, id)

        }
    }

    gui.add(copyObj, 'save')


    const randomTemp = {
        random: () => {
            Object.keys(controls).forEach(key => {
                controls[key] = ranges[key].min + Math.random() * (ranges[key].max - ranges[key].min)
            })
        }
    }

    gui.add(randomTemp, 'random')


    const saves = localStorage.getItem('saves')
    const parsedSaves = JSON.parse(saves || '{}')

    Object.keys(parsedSaves).forEach(id => {

        if (id != 'window') {
            const temp = {}

            temp[id] = () => {
                Object.keys(controls).forEach(key => {
                    if (key in parsedSaves[id]) {
                        applySave(key, parsedSaves[id][key])
                    }
                })
            }

            gui.add(temp, id)
        }
    });


}

const canvas = document.querySelector('canvas#sketch');

const ctx = canvas.getContext('2d');
ctx.lineCap = 'round'
ctx.strokeStyle = 'rgba(255,255,255,1)';
ctx.lineWidth = 5;

const width = canvas.width;
const height = canvas.height;

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4; // default to medium smooth
let perlin_amp_falloff = 0.5; // 50% reduction/octave

const scaled_cosine = i => 0.5 * (1.0 - Math.cos(i * Math.PI));

let perlin; // will be initialized lazily by noise() or noiseSeed()

function noise(x, y = 0, z = 0) {
    if (perlin == null) {
        perlin = new Array(PERLIN_SIZE + 1);
        for (let i = 0; i < PERLIN_SIZE + 1; i++) {
            perlin[i] = Math.random();
        }
    }

    if (x < 0) {
        x = -x;
    }
    if (y < 0) {
        y = -y;
    }
    if (z < 0) {
        z = -z;
    }

    let xi = Math.floor(x),
        yi = Math.floor(y),
        zi = Math.floor(z);
    let xf = x - xi;
    let yf = y - yi;
    let zf = z - zi;
    let rxf, ryf;

    let r = 0;
    let ampl = 0.5;

    let n1, n2, n3;

    for (let o = 0; o < perlin_octaves; o++) {
        let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

        rxf = scaled_cosine(xf);
        ryf = scaled_cosine(yf);

        n1 = perlin[of & PERLIN_SIZE];
        n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
        n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
        n1 += ryf * (n2 - n1);

        of += PERLIN_ZWRAP;
        n2 = perlin[of & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
        n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
        n2 += ryf * (n3 - n2);

        n1 += scaled_cosine(zf) * (n2 - n1);

        r += n1 * ampl;
        ampl *= perlin_amp_falloff;
        xi <<= 1;
        xf *= 2;
        yi <<= 1;
        yf *= 2;
        zi <<= 1;
        zf *= 2;

        if (xf >= 1.0) {
            xi++;
            xf--;
        }
        if (yf >= 1.0) {
            yi++;
            yf--;
        }
        if (zf >= 1.0) {
            zi++;
            zf--;
        }
    }
    return r;
};


function rotate(vector, theta) {
    const x = vector[0];
    const y = vector[1];
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    return [x * cosTheta - y * sinTheta, x * sinTheta + y * cosTheta];
}


function magnitude(vector) {
    const x = vector[0];
    const y = vector[1];
    return Math.sqrt(x * x + y * y);
}

function normalize(vector) {
    const magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    return [vector[0] / magnitude, vector[1] / magnitude];
}

let frameCount = 0;

const treshold = 1000;

let offsetAngle = 0;

function draw() {
    if (window.innerWidth < 200) {
        return;
    }

    const density = controls.baseDensity + Math.sin(frameCount * controls.densityShiftSpeed) * controls.densityShiftAmplitude;

    const spacing = width / density;

    const grd = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, (width / 2) * 0.75);
    grd.addColorStop(0, `hsl(341 100% ${35 + Math.sin(frameCount * 0.1) * 10}%)`);
    grd.addColorStop(1, "black");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    const orb = makeOrb(orbLocation[0], orbLocation[1])

    for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 100; j++) {
            const x = i * spacing;
            const y = j * spacing;

            const animatedLength = controls.lineLength + Math.sin(Math.sin(x / height * Math.PI / 2) + frameCount * controls.lineLengthSpeed) * noise(x, y) * 4;

            const v = [0, animatedLength];

            const dispalcementy = [Math.sin(x / height * Math.PI / 2) + frameCount * controls.speed, Math.sin(y / height * Math.PI / 2) + frameCount * controls.speed]

            const rotated_v = rotate(v, noise((x - dispalcementy[0]) * controls.noiseScale, (y + dispalcementy[1]) * controls.noiseScale, frameCount * 0.05) * Math.PI / 2);

            let middle = (i === orbLocation[0] && j == orbLocation[1]) ? orb : [x, y + animatedLength / 2];

            ctx.beginPath();
            ctx.moveTo(middle[0] - rotated_v[0] / 2, middle[1] - rotated_v[1] / 2);
            ctx.lineTo(middle[0] + rotated_v[0] / 2, middle[1] + rotated_v[1] / 2);
            ctx.stroke();
        }
    }


    mask();
    frameCount++;
    requestAnimationFrame(draw)
}

draw();

function mask() {
    let numVertices = 50;
    let size = 200;

    let angle = (Math.PI * 2) / numVertices;
    let vertices = [];

    const advance = frameCount / 20;

    let amp = 15;

    // Calculate the x and y coordinates of each vertex
    for (let i = 0; i < numVertices; i++) {
        const x = width / 2 + Math.cos(angle * i) * size;
        const y = height / 2 + Math.sin(angle * i) * size;
        vertices.push([
            x + Math.sin(noise(x, y, advance + x * 10) * Math.PI * 2) * amp,
            y + Math.sin(noise(x, y, advance + y * 10) * Math.PI * 2) * amp,
        ]);
    }

    vertices = chaikin(vertices, numVertices);

    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.filter = "blur(5px)";  // "feather"

    ctx.beginPath();
    ctx.fillStyle = "red";

    ctx.moveTo(vertices[0][0], vertices[0][1]);
    for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i][0], vertices[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = "none";
}

// Function to implement the Chaikin curve subdivision algorithm
function chaikin(vertices) {
    let newVertices = [];
    let fraction = 0.2; // fraction of the distance to the midpoint

    for (let i = 0; i < vertices.length - 1; i++) {
        let a = vertices[i];
        let b = vertices[i + 1];

        let midpoint = {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
        };

        let controlPointA = {
            x: a.x + (midpoint.x - a.x) * fraction,
            y: a.y + (midpoint.y - a.y) * fraction,
        };

        let controlPointB = {
            x: b.x + (midpoint.x - b.x) * fraction,
            y: b.y + (midpoint.y - b.y) * fraction,
        };

        newVertices.push(a, controlPointA, controlPointB, b);
    }

    // Connect the last vertex with the first vertex
    let a = vertices[vertices.length - 1];
    let b = vertices[0];

    let midpoint = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
    };

    let controlPointA = {
        x: a.x + (midpoint.x - a.x) * fraction,
        y: a.y + (midpoint.y - a.y) * fraction,
    };

    let controlPointB = {
        x: b.x + (midpoint.x - b.x) * fraction,
        y: b.y + (midpoint.y - b.y) * fraction,
    };

    newVertices.push(a, controlPointA, controlPointB, b);

    return newVertices;
}
