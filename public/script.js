const canvas = document.getElementById('whiteboard');
const context = canvas.getContext('2d');
let drawing = false;

const ABLY_API_KEY = 'vs0gFA.NbouvA:uZfEJWt8iSRmEGidwqVBUFyLK3kfis0FSCRwJ_qm5G4';
const ably = new Ably.Realtime(ABLY_API_KEY);
const whiteboardChannel = ably.channels.get('whiteboardChannel');
const button = document.getElementById('button');
const messageElement = document.getElementById('message');
const colorPalette = document.getElementById('colorPalette');
let selectedColor = '#000000'; // Default color
let canvasRect = canvas.getBoundingClientRect();
let canvasx = canvasRect.left;
let canvasy = canvasRect.top;
let mousedown = false;
let last_mousex = last_mousey = 0;
let drawingTool = 'freehand'
var rectangles = [];
let brushSize = 5
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const gridCanvas = document.getElementById('gridCanvas');
const gridContext = gridCanvas.getContext('2d');
const gridButton = document.getElementById('gridButton');
//const straightLineButton = document.getElementById('straightLine');
let isDrawingStraightLine = false;
let startLine = { x: 0, y: 0 };
let showGrid = false;

// straightLineButton.addEventListener('click', () => {
//     isDrawingStraightLine = true;
// });

gridButton.addEventListener('click', () => {
    showGrid = !showGrid;
    toggleGrid();
    whiteboardChannel.publish('grid', {
      showGridV: showGrid
    });
});

whiteboardChannel.subscribe('grid', (message) => {
    if (message.data.showGridV) {
        canvas.style.backgroundImage = 'url("cursor.svg")';
    } else {
        canvas.style.backgroundImage = 'none';
    }
});



function toggleGrid() {
    if (showGrid) {
        canvas.style.backgroundImage = 'url("cursor.svg")';
    } else {
        canvas.style.backgroundImage = 'none';
    }
}

function drawGrid() {
    const gridSize = 20; // Adjust the grid size as needed
    const gridColor = 'lightgray';

    gridCanvas.style.display = 'block'; // Show the grid canvas

    gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height); // Clear existing grid

    for (let x = 0; x < gridCanvas.width; x += gridSize) {
        for (let y = 0; y < gridCanvas.height; y += gridSize) {
            gridContext.strokeStyle = gridColor;
            gridContext.strokeRect(x, y, gridSize, gridSize);
        }
    }
}

function clearGrid() {
    gridCanvas.style.display = 'none';
}

function drawAndPublish() {
    drawingTool = 'rectangle'
}

brushSizeInput.addEventListener('input', () => {
    brushSize =  brushSizeInput.value;
    brushSizeValue.textContent = brushSize; // Update the displayed brush size
});

document.getElementById('brush').addEventListener('click', (e) => {
    const brushX = e.clientX - canvas.getBoundingClientRect().left;
    const brushY = e.clientY - canvas.getBoundingClientRect().top;
    drawingTool = 'brush';
    context.beginPath();
    context.arc(brushX, brushY, brushSize, 0, 2 * Math.PI);
    context.fillStyle = selectedColor;
    context.fill();
    context.closePath();
});


whiteboardChannel.subscribe('rectangle', (message) => {
    context.beginPath();
    const data = message.data
    var width = message.data.mousexV - message.data.last_mousexV;
    var height = message.data.mouseyV - message.data.last_mouseyV;
    context.rect(message.data.last_mousexV, message.data.last_mouseyV, width, height);
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.stroke();
});

whiteboardChannel.subscribe('brush', (message) => {
    context.beginPath();
    context.arc(message.data.brushXV, message.data.brushYV, message.data.brushSizeV, 0, 2 * Math.PI);
    context.fillStyle = message.data.colorV;
    context.fill();
    context.closePath();
});

whiteboardChannel.subscribe('rectangle1', (message) => {
   //context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    const data = message.data
    context.rect(message.data.ix, message.data.iy, message.data.iw, message.data.iw);
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.stroke();
});

document.getElementById("drawButton").addEventListener("click", drawAndPublish);


canvas.id = 'whiteboardChannel';
whiteboardChannel.subscribe('drawing', (message) => {
    const data = message.data;
    selectedColor = data.color;
    drawLine(data.start, data.end, selectedColor);
});

function clearWhiteboard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

clearButton.addEventListener('click', () => {
    clearWhiteboard();
    whiteboardChannel.publish('clear', 'clear-whiteboard');
});

whiteboardChannel.subscribe('clear', (message) => {
    if (message.data === 'clear-whiteboard') {
        clearWhiteboard();
    }
});


whiteboardChannel.subscribe('clear', () => {
    clearWhiteboard();
});

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}


// Function to draw a line on the canvas
function drawLine(start, end, color) {
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.lineCap = 'round';

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.closePath();
}

function drawRectangle(startX, startY, endX, endY, color) {
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.rect(startX, startY, endX, endY);
    context.stroke();
    context.closePath();
}

// Function to draw circles
function drawCircle(start, end, color) {
    context.strokeStyle = color;
    context.lineWidth = 2;
    const radius = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    context.beginPath();
    context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    context.stroke();
    context.closePath();
}


// Subscribe to the 'message' channel
whiteboardChannel.subscribe('message', (message) => {
    messageElement.textContent = `Received: ${message.data}`;
});



// Click event listener for the button
button.addEventListener('click', () => {
    whiteboardChannel.publish('message', '123');
});

// Mouse event listeners for drawing on the canvas
canvas.addEventListener('mousedown', (e) => {
    if (isDrawingStraightLine) {
        startLine = { x: e.clientX - canvasx, y: e.clientY - canvasy };
    }
    else if(drawingTool === 'rectangle') {
        last_mousex = parseInt(e.clientX - canvasx);
        last_mousey = parseInt(e.clientY - canvasy);
        mousedown = true;
    } else {
        drawing = true;
        previousPosition = {x: e.clientX, y: e.clientY};
    }
});

colorPalette.addEventListener('click', (e) => {
    if (e.target.classList.contains('color')) {
        selectedColor = e.target.getAttribute('data-color');
    }
});




canvas.addEventListener('mousemove', (e) => {
    if(drawingTool === 'rectangle') {
        mousex = parseInt(e.clientX - canvasx);
        mousey = parseInt(e.clientY - canvasy);

        if (mousedown) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < rectangles.length; i++) {
                // context.beginPath();
                // context.rect(rectangles[i].x, rectangles[i].y, rectangles[i].width, rectangles[i].height);
                // context.strokeStyle = 'black';
                // context.lineWidth = 2;
                // context.stroke();

                whiteboardChannel.publish('rectangle1', {
                    ix: rectangles[i].x,
                    iy: rectangles[i].y,
                    iz: rectangles[i].width,
                    iw: rectangles[i].height
                });
            }
            // context.beginPath();
            // var width = mousex - last_mousex;
            // var height = mousey - last_mousey;
            // context.rect(last_mousex, last_mousey, width, height);
            // context.strokeStyle = selectedColor
            // context.lineWidth = 2;
            // context.stroke();

            // whiteboardChannel.publish('rectangle', {
            //     mousexV: mousex,  // Replace with your desired X coordinate
            //     mouseyV: mousey,  // Replace with your desired Y coordinate
            //     last_mousexV: last_mousex,   // Replace with your desired X coordinate
            //     last_mouseyV: last_mousey,// : currentPosition.y,   // Replace with your desired Y coordinate
            //     color: selectedColor,
            //     abc : '123'
            // });
        } }
        else if (isDrawingStraightLine) {
            const endLine = { x: e.clientX - canvasx, y: e.clientY - canvasy };
           clearCanvas(); // Clear the canvas to avoid overlapping lines

            // Draw the straight line
            context.beginPath();
            context.moveTo(startLine.x, startLine.y);
            context.lineTo(endLine.x, endLine.y);
            context.strokeStyle = selectedColor;
            context.lineWidth = 2;
            context.stroke();
        }

     else if(drawingTool === 'brush') {
        if (!drawing) return;
        const brushX = e.clientX - canvas.getBoundingClientRect().left;
        const brushY = e.clientY - canvas.getBoundingClientRect().top;
        context.beginPath();
        context.arc(brushX, brushY, brushSize, 0, 2 * Math.PI);
        context.fillStyle = selectedColor;
        context.fill();
        context.closePath();

        whiteboardChannel.publish('brush', {brushXV: brushX, brushYV: brushY, colorV: selectedColor, brushSizeV: brushSize});
    }

    else {
        if (!drawing) return;
        const currentPosition = {x: e.clientX, y: e.clientY};
        drawLine(previousPosition, currentPosition, selectedColor);
        // Publish the drawing data to Ably
        whiteboardChannel.publish('drawing', {start: previousPosition, end: currentPosition, color: selectedColor});
        previousPosition = currentPosition;
    }

});

canvas.addEventListener('mouseup', () => {
    if(drawingTool === 'rectangle') {
        mousedown = false;
        var width = mousex - last_mousex;
        var height = mousey - last_mousey;
        rectangles.push({
            x: last_mousex,
            y: last_mousey,
            width: width,
            height: height
        });
    } else if (isDrawingStraightLine) {
        isDrawingStraightLine = false;
    }
    else if (isDrawingStraightLine) {
        startLine = { x: e.clientX - canvasx, y: e.clientY - canvasy };
    }
    else {
        drawing = false;
    }
});

document.getElementById('freehand').addEventListener('click', () => {
    drawingTool = 'freehand';
    canvas.style.cursor = 'url(path-to-your-pencil-cursor-image.png), auto';
});

document.getElementById('rectangle').addEventListener('click', () => {
    currentTool = 'rectangle';
    canvas.style.cursor = 'crosshair'; // Change to a crosshair cursor
});

document.getElementById('circle').addEventListener('click', () => {
    currentTool = 'circle';
    canvas.style.cursor = 'crosshair'; // Change to a crosshair cursor
});