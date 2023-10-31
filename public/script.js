const canvas = document.getElementById('whiteboard');
const context = canvas.getContext('2d');
let drawing = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ABLY_API_KEY = 'vs0gFA.NbouvA:uZfEJWt8iSRmEGidwqVBUFyLK3kfis0FSCRwJ_qm5G4';
const ably = new Ably.Realtime(ABLY_API_KEY);
const whiteboardChannel = ably.channels.get('whiteboardChannel');
const colorPalette = document.getElementById('colorPalette');
let selectedColor = '#000000';
let mousedown = false;
let last_mousex = last_mousey = 0;
let drawingTool = 'freehand'
let brushSize = 5
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const gridButton = document.getElementById('gridButton');
let showGrid = false;
let mouseX, mouseY;
const colorButtons = document.querySelectorAll('.color');
const colorListButtons = document.querySelectorAll('#colorList .color');
const forbiddenAreaWidth = 20

colorListButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        const selectedColor = button.getAttribute('data-color');

    document.getElementById('buttonColorId').style.backgroundColor = selectedColor
    colorButtons.style.backgroundColor = selectedColor
       context.strokeStyle = selectedColor;
    });
});

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

gridButton.addEventListener('click', () => {
    showGrid = !showGrid;
    toggleGrid();
    whiteboardChannel.publish('grid', {
      showGridV: showGrid
    });
});

whiteboardChannel.subscribe('grid', (message) => {
    if (message.data.showGridV) {
        canvas.style.backgroundImage = 'url("grid-background.jpg")';
    } else {
        canvas.style.backgroundImage = 'none';
    }
});

function toggleGrid() {
    if (showGrid) {
        canvas.style.backgroundImage = 'url("grid-background.jpg")';
        canvas.style.backgroundSize = '600px 400px'
    } else {
        canvas.style.backgroundImage = 'none';
    }
}

brushSizeInput.addEventListener('input', () => {
    brushSize =  brushSizeInput.value;
    brushSizeValue.textContent = brushSize;
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

whiteboardChannel.subscribe('brush', (message) => {
    context.beginPath();
    context.arc(message.data.brushXV, message.data.brushYV, message.data.brushSizeV, 0, 2 * Math.PI);
    context.fillStyle = message.data.colorV;
    context.fill();
    context.closePath();
});

canvas.id = 'whiteboardChannel';
whiteboardChannel.subscribe('drawing', (message) => {
    const data = message.data;
    selectedColor = data.color;
    context.strokeStyle = data.color;
    context.lineWidth = data.brushSizeV;
    context.lineCap = 'round';

    context.beginPath();
    context.moveTo(data.start.x, data.start.y);
    context.lineTo(data.end.x, data.end.y);
    context.stroke();
    context.closePath();
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


function drawLine(start, end, color) {
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.lineCap = 'round';

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.closePath();
}


canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    previousPosition = {x: e.clientX, y: e.clientY};
});

colorPalette.addEventListener('click', (e) => {
    if (e.target.classList.contains('color')) {
        selectedColor = e.target.getAttribute('data-color');
    }
});

canvas.addEventListener('mousemove', (e) => {
    if(drawingTool === 'brush') {
        if (!drawing) return;
        const brushX = e.clientX - canvas.getBoundingClientRect().left;
        const brushY = e.clientY - canvas.getBoundingClientRect().top;
        context.beginPath();
        context.arc(brushX, brushY, brushSize, 0, 2 * Math.PI);
        context.fillStyle = selectedColor;
        context.fill();
        context.closePath();

        whiteboardChannel.publish('brush', {
            brushXV: brushX, brushYV: brushY, colorV: selectedColor, brushSizeV: brushSize
        });
    }

    else {
        if (!drawing) return;
        const currentPosition = {x: e.clientX, y: e.clientY};
        drawLine(previousPosition, currentPosition, selectedColor);
        whiteboardChannel.publish('drawing', {
            start: previousPosition, end: currentPosition, color: selectedColor, brushSizeV: brushSize
        });
        previousPosition = currentPosition;
    }
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});

document.getElementById('freehand').addEventListener('click', () => {
    drawingTool = 'freehand';
    canvas.style.cursor = 'url(path-to-your-pencil-cursor-image.png), auto';
});


const brushValue = document.querySelector('.brush-value');

brushSizeInput.addEventListener('input', function () {
    brushValue.textContent = this.value;
});
