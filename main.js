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
const request = require('request');
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
    if (req.method === 'POST') {
        try {
            let data = '';
            req.on('data', chunk => {
                data += chunk.toString();
            });

            req.on('end', async () => {
                const formData = new URLSearchParams(data);
                const name = formData.get('name');
                const email = formData.get('email');
                const subject = formData.get('subject');
                const message = formData.get('message');
                const grecaptcha = formData.get('g-recaptcha-response');

                if (!grecaptcha) {
                    return res.status(400).sendFile(path.join(__dirname, 'public/contact.html'));
                    // .send('reCAPTCHA not provided.');
                }

                // Verify the reCAPTCHA
                request.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${grecaptcha}`, async (error, response, body) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).sendFile(path.join(__dirname, 'public/contact.html'));
                        // .send('reCAPTCHA verification failed.');
                    }

                    const parsedBody = JSON.parse(body);
                    if (!parsedBody.success) {
                        return res.status(400).sendFile(path.join(__dirname, 'public/contact.html'));
                        // .send('Invalid reCAPTCHA.');
                    }

                    // Send the email
                    try {
                        const info = await transporter.sendMail({
                            from: process.env.FROMEMAIL,
                            to: process.env.SENDEMAIL,
                            replyTo: email,
                            subject: `ENGR110.austin.kim - ${subject}`,
                            text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
                        });

                        console.log('Email sent:', info.response);
                        return res.status(202).sendFile(path.join(__dirname, 'public/contact.html'));
                        // .send('Email sent successfully.');
                    } catch (emailError) {
                        console.error(emailError);
                        return res.status(500).sendFile(path.join(__dirname, 'public/contact.html'));
                        // .send('Failed to send email.');
                    }
                });
            });
        } catch (err) {
            console.error(err);
            return res.status(500)
            // .send('Server error.');
        }
    }
    else
        res.sendFile(path.join(__dirname, 'public/contact.html'));
});

app.use('/project', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/project.html'));
});

app.use('/chart', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/Water Feature Gantt Chart/GanttChart.html'));
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
