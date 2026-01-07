// Simple Node.js HTTP Server for Serving Static Files
// This server hosts the Todo app locally, allowing it to run without a full web server.
// It serves HTML, JS, and CSS files from the current directory.
// Purpose: Enable local development and testing of the client-side app.

const http = require('http'); // Node.js built-in HTTP module for creating a server
const fs = require('fs'); // File system module to read files
const path = require('path'); // Path module to handle file paths safely

// Create an HTTP server
const server = http.createServer((req, res) => {
    // Determine the file path: Serve index.html for root, otherwise the requested file
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Determine content type based on file extension
    const ext = path.extname(filePath);
    let contentType = 'text/html'; // Default to HTML
    switch (ext) {
        case '.js':
            contentType = 'text/javascript'; // For JavaScript files
            break;
        case '.css':
            contentType = 'text/css'; // For CSS files
            break;
    }

    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // File not found or error
            res.writeHead(404);
            res.end('File not found');
        } else {
            // Success: Send the file with appropriate content type
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

// Start the server on port 3001
server.listen(3001, () => {
    console.log('Server running at http://localhost:3001'); // Log the URL for access
});