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
    res.locals.message= null;
    res.locals.user=null;
    // Auto-hide for these routes
    const hideNavbarRoutes = ["/", "/login", "/register", "/reset-password"];
    if (hideNavbarRoutes.includes(req.path)) {
        res.locals.hideNavbar = true;
    }
    next();
});

// app.get('/', (req, res)=> res.render('index'));
// app.get('/test', (req, res) => res.type('text').send('TEST from app.js'));
app.use('/', require('./src/routes/_router'));

// CATCH-ALL ROUTE (MUST be AFTER all other specific routes)
app.use((req, res, next) => {
    res.status(404).render('error', { title: 'Page Not Found', layout: false });
});

// Optional: General error handler for server errors (e.g., 500)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('<h1>500 - Server Error</h1><p>Something went wrong on our end!</p>');
});

// Start server
app.listen(port, '0.0.0.0', () => {
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