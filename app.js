require('dotenv').config();
require('./src/config/db');
const express = require('express');
const app = express();
const path = require('path');
const os = require('os');
const port = process.env.PORT || 6200;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');
const log = console.log;
ejs.delimiter = '?';
const http = require('http');
const { Server } = require('socket.io');


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(require('express-ejs-layouts'));
app.use(express.static(path.join(__dirname, 'src', 'public')));

// 🔹 Middleware to set default navbar visibility
app.use((req, res, next) => {
    res.locals.hideNavbar = false; // default: show navbar
    res.locals.error = null;
    res.locals.message = null;
    res.locals.user = null;
    // Auto-hide for these routes
    const hideNavbarRoutes = ["/", "/login", "/register", "/reset-password"];
    if (hideNavbarRoutes.includes(req.path)) {
        res.locals.hideNavbar = true;
    }
    next();
});

// app.get('/', (req, res)=> res.render('index'));
// app.get('/test', (req, res) => res.type('text').send('TEST from app.js'));
// app.use('/', require('./src/routes/_router'));
try {
    const routes = require('./src/router/routes');
    app.use('/', routes);
} catch (e) {
    // Fallback route (so the app still boots if routes aren't wired yet)
    app.get('/', (_req, res) => {
        res.send('App is running. (Routes module not found or not configured)');
    });
}

const server = http.createServer(app);
const io = new Server(server);
// Make io available to controllers: req.app.get('io')
app.set('io', io);

const ticketRoom = (id) => `ticket_${id}`;

io.on('connection', (socket) => {
    // Client will ask to join a ticket room when they open the follow-up page
    socket.on('joinTicket', (ticketId) => {
        if (!Number.isInteger(ticketId) || ticketId <= 0) return;
        socket.join(ticketRoom(ticketId));
    });

    socket.on('leaveTicket', (ticketId) => {
        if (!Number.isInteger(ticketId) || ticketId <= 0) return;
        socket.leave(ticketRoom(ticketId));
    });
});

// ----- 404 handler -----
app.use((req, res, _next) => {
    res.status(404);
    // Render a 404.ejs if you have one; otherwise send text
    try {
        return res.render('404', { url: req.originalUrl });
    } catch {
        return res.send(`Not Found: ${req.originalUrl}`);
    }
});


// ----- Error handler -----
app.use((err, _req, res, _next) => {
    console.error(err);
    const status = err.status || 500;
    // Render an error.ejs if present; otherwise send JSON
    try {
        return res.status(status).render('error', {
            status,
            message: err.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    } catch {
        return res.status(status).json({
            status,
            message: err.message || 'Internal Server Error',
        });
    }
});

// Start server
server.listen(port, '0.0.0.0', () => {
    const networkInterfaces = os.networkInterfaces();
    let hostAddress;

    for (const name in networkInterfaces) {
        const interfaces = networkInterfaces[name]; //console.log(interfaces)
        for (const iface of interfaces) {
            if (iface.family === 'IPv4' && !iface.internal) {
                hostAddress = iface.address;
                break;
            }
        }
        if (hostAddress) break;
    }

    if (hostAddress) {
        console.log(`Server started at http://${hostAddress}:${port}`);
    } else {
        console.log(`Server started on port ${port}, but could not determine host IP address.`);
    }
});