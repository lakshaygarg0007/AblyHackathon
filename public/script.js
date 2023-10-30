const canvas = document.getElementById('whiteboard');
const context = canvas.getContext('2d');
let drawing = false;
let previousPosition;

const ABLY_API_KEY = 'vs0gFA.NbouvA:uZfEJWt8iSRmEGidwqVBUFyLK3kfis0FSCRwJ_qm5G4';
const ably = new Ably.Realtime(ABLY_API_KEY);
const whiteboardChannel = ably.channels.get('whiteboardChannel');
const button = document.getElementById('button');
const messageElement = document.getElementById('message');
const colorPalette = document.getElementById('colorPalette');
let selectedColor = '#000000'; // Default color

canvas.id = 'whiteboardChannel';
whiteboardChannel.subscribe('drawing', (message) => {
    const data = message.data;
    selectedColor = data.color;
    drawLine(data.start, data.end, selectedColor);
});

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

// Subscribe to the 'message' channel
whiteboardChannel.subscribe('message', (message) => {
    messageElement.textContent = `Received: ${message.data}`;
});

// Subscribe to the 'drawing' channel


// Click event listener for the button
button.addEventListener('click', () => {
    whiteboardChannel.publish('message', '123');
});

// Mouse event listeners for drawing on the canvas
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    previousPosition = { x: e.clientX, y: e.clientY };
});

colorPalette.addEventListener('click', (e) => {
    if (e.target.classList.contains('color')) {
        selectedColor = e.target.getAttribute('data-color');
    }
});



canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const currentPosition = { x: e.clientX, y: e.clientY };
    drawLine(previousPosition, currentPosition, selectedColor);
    // Publish the drawing data to Ably
    whiteboardChannel.publish('drawing', { start: previousPosition, end: currentPosition, color: selectedColor });
    previousPosition = currentPosition;

});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});
