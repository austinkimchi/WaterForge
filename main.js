/**
 * ENGR110 Community Research Project
 * Built by Austin Kim
 * Used: Express, Nodemailer
 * 09/29/2024
 **/
const express = require('express');
const path = require('path');
const app = express();
const nodemailer = require('nodemailer');
const { get } = require('https');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    port: 587,
    host: "live.smtp.mailtrap.io",
    auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
    },
    secure: false,
    tls: {
        ciphers: 'SSLv3'
    }
});

app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/etc', express.static(path.join(__dirname, 'public/etc')));

app.use('/about', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/about.html'));
});

app.use('/contact', async (req, res) => {
    // check if the request is POST
    if (req.method === 'POST') {
        // get the form data
        let data = '';
        req.on('data', chunk => {
            data += chunk.toString();
        });
        req.on('end', async () => {
            // parse the form data
            const formData = new URLSearchParams(data);
            // get the name and email
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            const grecaptcha = formData.get('g-recaptcha-response');

            if (grecaptcha == "" || !grecaptcha) {
                res.status(400);
                return;
            };

            // verify the recaptcha
            get('https://www.google.com/recaptcha/api/siteverify?secret=' + process.env.RECAPTCHA_SECRET + '&response=' + grecaptcha, async (err, ress, body) => {
                console.log(ress.statusCode);
                if (err) {
                    res.status(500);
                    return;
                }

                const recaptcha = JSON.parse(await body);
                console.log(recaptcha.success);
                if (!recaptcha.success) {
                    res.status(400);
                    return;
                }


                // send the email
                transporter.sendMail({
                    from: process.env.FROMEMAIL,
                    to: process.env.SENDEMAIL,
                    replyTo: email,
                    subject: `ENGR110.austin.kim - ${subject}`,
                    text: `Name: ${name}\nEmail: ${email}\n\n${message}`
                }, (error, info) => {
                    if (error) {
                        console.log(error);
                        res.status(500);
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.status(200);
                    }
                }
                );

                res.status(202);
            });

            res.status(405);
        });
    }

    res.sendFile(path.join(__dirname, 'public/contact.html'));
});

app.use('/project', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/project.html'));
});

app.use('/', async (req, res) => {
    if (req.url === '/' || req.url === '/home')
        res.sendFile(path.join(__dirname, 'public/home.html'));
    else
        res.sendFile(path.join(__dirname, 'public/404.html'));
});

app.use(async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/404.html'));
});


var port = process.env.PORT || 3000;

if (process.env.MODE && process.env.MODE.toLowerCase() == 'prod')
    port = process.env.PRODPORT;
else if (process.env.MODE && process.env.MODE.toLowerCase() == 'dev')
    port = process.env.DEVPORT;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
