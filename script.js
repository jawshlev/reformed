let video;
let canvas;
let faceMesh;
let faces = [];
let graphics = [];
let showText = false;
let showBackground = true;
let showSidebar = true;

// Define keypoint groups with nested arrays
let keypointGroups = {
  brows: {
    rightBrow: [105, 66],
    leftBrow: [334, 296]
  },
  nose: {
    leftLowerBridge: [3],
    rightLowerBridge: [248],
    middleBridge:[168],
    rightNostril: [45],
    leftNostril: [275],
  },
  eyes: {
    leftEye: [362, 263],
    leftEye2: [362, 263],
    leftEye3: [362, 263],
    rightEye: [133, 33],
    rightEye2: [133, 33],
    rightEye3: [133, 33]
  },
  mouth: {
    lips: [0, 13, 14, 17]
  },
  faceEdge: {
    ear: [93],
    lowerCheek: [177],
    lowerCheek2: [149],
    leftUpperChin: [172]
  },
  chin:{
    leftChin: [148],
    rightChin: [377],
    middleChin:[152]
  },
  baseFeatures: {
    noseBase: [19],
    leftEyeBase: [374, 386],
    rightEyeBase: [145, 159],
    baseChin: [200, 199]
  },
  defaultEyes: {
    defaultleftEye: [362, 263],
    defaultrightEye: [133, 33]
  },
  defaultNose: {
    defaultbridge: [6, 168],
    defaultnostrils: [4, 45, 275]
  },
  defaultMouth: {
    defaultlips: [0, 13, 14, 17]
  }
};

// Define custom sizes for each feature
let graphicSizes = {
  brows: [150, 50], // Wider but shorter for eyebrows
  eyes: [115, 60],
  baseFeatures: [45, 45],
  nose: [60, 90],
  faceEdge: [60, 90],
  chin: [60, 45],
  mouth: [100, 100],
  defaultEyes: [115, 60],
  defaultNose: [60, 90],
  defaultMouth: [100, 100]
};

// Predefined x and y coordinates for each feature
let graphicPositions = {
  rightBrow: { x: 132.00, y: 46.00 },
  leftBrow: { x: 348.00, y: 46.00 },
  
  leftEye: { x: 326.00, y: 165.00 },
  leftEye2: { x: 367.00, y: 131.00 },
  leftEye3: { x: 342.00, y: 83.00 },
  rightEye: { x: 188.00, y: 163.00 },
  rightEye2: { x: 154.00, y: 128.00 },
  rightEye3: { x: 182.00, y: 83.00 },
  
  lips: { x: 266.00, y: 298.00 },
  
  leftLowerBridge: { x: 261.00, y: 185.71 },
  middleBridge: { x: 287.89, y: 165.87 },
  rightLowerBridge: { x: 311.39, y: 189.58 },
  rightNostril: { x: 278.00, y: 227.00 },
  leftNostril: { x: 296.00, y: 228.00 },
  
  noseBase: { x: 297.00, y: 267.00 },
  leftEyeBase: { x: 360.00, y: 171.00 },
  rightEyeBase: { x: 229.00, y: 171.00 },
  baseChin: { x: 297.00, y: 364.00 },
  
  ear: { x: 121.30, y: 92.94 },
  lowerCheek: { x: 135.23, y: 182.57 },
  lowerCheek2: { x: 207.74, y: 318.33 },
  leftUpperChin: { x: 171.91, y: 267.40 },
  
  leftChin: { x: 267.82, y: 385.63 },
  rightChin: { x: 313.07, y: 383.94 },
  middleChin: { x: 291.93, y: 390.80 },
  
  defaultleftEye: { x: 320, y: 150 },
  defaultrightEye: { x: 200, y: 150 },
  defaultbridge: { x: 270, y: 175 },
  defaultnostrils: { x: 270, y: 250 },
  defaultlips: { x: 270, y: 290 }
};


function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: false });
}

function gotFaces(results) {
  faces = results;
}

function setup() {
  canvas = createCanvas(1180, 800);
  canvas.parent("canvas-container");
  video = createCapture(VIDEO, { flipped: false });
  video.hide();
  faceMesh.detectStart(video, gotFaces);

  function addGraphicsFromGroups(group, parentName = "") {
    for (let key in group) {
      let fullName = parentName ? `${parentName}.${key}` : key;
      let val = group[key];

      if (Array.isArray(val)) {
        if (!fullName.startsWith("default")) {
          let parentSize = graphicSizes[parentName] || [150, 150]; // Use predefined sizes or default
          let [w, h] = parentSize;

          // Use predefined positions if available, otherwise random
          let x = graphicPositions[key] ? graphicPositions[key].x : random(50, 400);
          let y = graphicPositions[key] ? graphicPositions[key].y : random(50, 300);

          graphics.push(new DraggableGraphic(fullName, val, w, h, x, y));
        }
      } else {
        addGraphicsFromGroups(val, fullName);
      }
    }
  }

  // Process all nested groups
  addGraphicsFromGroups(keypointGroups);
}

function draw() {
  if(showBackground){
    background(255);
  }
  // // Draw a center line in the middle of the canvas
  // stroke(255); // Set the color of the line (white)
  // strokeWeight(1); // Set the thickness of the line
  // line(width / 2, 0, width / 2, height); // Vertical line at the center
  if(showSidebar){
    drawSidebar();
  }
  
  if (faces.length > 0) {
    let face = faces[0];

    for (let g of graphics) {
      g.update(face);
      g.display();
    }
  }
  
  // Optionally display the name and coords of each graphic for visual feedback
  if (showText) {
    fill(0);
    noStroke();
    for (let g of graphics) {
      textSize(12);
text(`${g.name}: (${g.x.toFixed(2)}, ${g.y.toFixed(2)})`, g.x, g.y - 10);    }
  }
}

// Class for draggable graphics
class DraggableGraphic {
  constructor(name, keypoints, w, h, x, y) {
    this.name = name;
    this.keypoints = keypoints;
    this.graphic = createGraphics(w, h);
    this.x = x;
    this.y = y;
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  update(face) {
    let extractedPoints = this.keypoints.map(index => face.keypoints[index]);
    this.drawKeypointsInBox(extractedPoints);
  }

  drawKeypointsInBox(keypoints) {
    if (!keypoints || keypoints.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let keypoint of keypoints) {
      minX = min(minX, keypoint.x);
      minY = min(minY, keypoint.y);
      maxX = max(maxX, keypoint.x);
      maxY = max(maxY, keypoint.y);
    }

    let padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    let featureCenterX = (minX + maxX) / 2;
    let featureCenterY = (minY + maxY) / 2;
    let regionWidth = maxX - minX;
    let regionHeight = maxY - minY;
    let scaleFactor = min(this.graphic.width / regionWidth, this.graphic.height / regionHeight);

    this.graphic.clear();
    this.graphic.background(255);
    this.graphic.push();
    this.graphic.translate(this.graphic.width / 2, this.graphic.height / 2);
    this.graphic.scale(scaleFactor);
    this.graphic.image(video, -featureCenterX, -featureCenterY);
    this.graphic.pop();
  }

  display() {
    image(this.graphic, this.x, this.y);
    noFill();
    stroke(255);
    rect(this.x, this.y, this.graphic.width, this.graphic.height);
  }

  contains(mx, my) {
    return mx > this.x && mx < this.x + this.graphic.width && my > this.y && my < this.y + this.graphic.height;
  }

  startDrag(mx, my) {
    if (this.contains(mx, my)) {
      this.dragging = true;
      this.offsetX = this.x - mx;
      this.offsetY = this.y - my;
    }
  }

  drag(mx, my) {
    if (this.dragging) {
      this.x = mx + this.offsetX;
      this.y = my + this.offsetY;
    }
  }

  stopDrag() {
    this.dragging = false;
  }
}


function drawSidebar() {
  let sidebarX = width - 160; // Move to the right

  fill(30);
  rect(sidebarX, 0, 160, height);

  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Add Features", sidebarX + 80, 30);

  drawButton("Default Eyes", sidebarX + 20, 50, () => addFeature("defaultEyes"));
  drawButton("Default Nose", sidebarX + 20, 100, () => addFeature("defaultNose"));
  drawButton("Default Lips", sidebarX + 20, 150, () => addFeature("defaultMouth"));
}

function drawButton(label, x, y, onClick) {
  fill(50);
  rect(x, y, 120, 30, 5);

  fill(255);
  textSize(14);
  textAlign(CENTER, CENTER);
  text(label, x + 60, y + 15);
}

function addFeature(category) {
  let features = keypointGroups[category];

  for (let feature in features) {
    let keypoints = features[feature];
    let [w, h] = graphicSizes[category] || [150, 150];

    let x = graphicPositions[feature] ? graphicPositions[feature].x : random(200, 600);
    let y = graphicPositions[feature] ? graphicPositions[feature].y : random(50, 400);

    graphics.push(new DraggableGraphic(feature, keypoints, w, h, x, y));
  }
}

// Mouse interactions
function mousePressed() {
    // only handle mouse press if clicking on the canvas element
  
    let draggingWindow = false;
  
    // Check if clicking on any graphic first
    for (let g of graphics) {
      if (g.contains(mouseX, mouseY)) {
        g.startDrag(mouseX, mouseY);
        draggingWindow = true;
        break;
      }
    }
  
    // Sidebar feature buttons (drawn in p5, not HTML)
    if (!draggingWindow && mouseX > width - 160) {
      if (mouseY >= 50 && mouseY < 80) addFeature("defaultEyes");
      if (mouseY >= 100 && mouseY < 130) addFeature("defaultNose");
      if (mouseY >= 150 && mouseY < 180) addFeature("defaultMouth");
    }
}
  

function mouseDragged() {
  for (let g of graphics) {
    g.drag(mouseX, mouseY);
  }
}

function mouseReleased() {
  for (let g of graphics) {
    g.stopDrag();
  }
}

function doubleClicked() {
  for (let i = graphics.length - 1; i >= 0; i--) { // Iterate backwards to safely remove elements
    if (graphics[i].contains(mouseX, mouseY)) {
      graphics.splice(i, 1); // Remove the clicked graphic from the array
      break; // Stop after removing one to avoid issues
    }
  }
}  
  
// Log all window positions when pressing 'p'
function keyPressed() {
  if (key === 'p') {
    console.log("Graphic positions:");
    for (let g of graphics) {
      console.log(`${g.name}: X = ${g.x.toFixed(2)}, Y = ${g.y.toFixed(2)}`);
    }
  }
  if (key === 't' || key === 'T') {
    showText = !showText; // Toggle the boolean
  }
  if (key == '1'){
    showSidebar = !showSidebar;
  }
  if (key == '2'){
    showBackground = !showBackground;
  }
}