import express from 'express';
import cors from 'cors';
import pkg from 'pg';    
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const allowedOrigins = [
    "https://resume-builder-nu-gray.vercel.app"
  ];
app.use(cors({
    origin: allowedOrigins,
    methods: ["POST"],
    credentials: true,
  }));

// Database Connection
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
};

// Generate PDF
const generatePDF = async (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, left: 50, right: 50, bottom: 50 },
            bufferPages: true
        });

        const pdfPath = path.join(__dirname, 'resume.pdf');
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Register fonts
        const fontPath = path.join(__dirname, 'fonts');
        doc.registerFont('Heading', path.join(fontPath, 'TimesNewRoman-Bold.ttf'));
        doc.registerFont('Body', path.join(fontPath, 'Arial.ttf'));

        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

        // Name
        doc.font('Heading').fontSize(24).text(data.name, { align: 'center' });

        // Contact info (email and phone)
        doc.moveDown(0.5);
        doc.font('Body').fontSize(10)
            .text(data.email, { align: 'center' })
            .text(data.phone, { align: 'center' });

        // Social links in one line
        const socialLinks = [
            { text: 'LinkedIn', link: data.linkedin },
            { text: 'GitHub', link: data.github },
            { text: 'Twitter', link: data.twitter },
            { text: 'Portfolio', link: data.portfolio }
        ].filter(item => item && item.link);

        doc.moveDown(0.5);
        socialLinks.forEach((item, index) => {
            doc.fillColor('blue')
                .text(item.text, { link: item.link, underline: true, continued: index < socialLinks.length - 1 });
            if (index < socialLinks.length - 1) {
                doc.text(' | ', { continued: true });
            }
        });

        doc.fillColor('black').moveDown(1.5);

        const addSection = (title) => {
            doc.moveDown(1.5);
            doc.font('Heading').fontSize(14).text(title.toUpperCase(), { underline: true });
            doc.moveDown(1);
        };

        // Education Section
        addSection('EDUCATION');
        data.education.forEach(edu => {
            doc.font('Heading').fontSize(12).text(edu.school, { continued: true }).lineGap(3);
            doc.font('Body').fontSize(10).text(`  ${edu.startDate} - ${edu.endDate}`, { align: 'right' });
            doc.font('Body').fontSize(10).text(edu.degree);
            doc.moveDown(1);
        });

        // Experience Section
        if (data.experience.some(exp => exp.title || exp.company)) {
            addSection('EXPERIENCE');
            data.experience.forEach(exp => {
                if (exp.title || exp.company) {
                    doc.font('Heading').fontSize(12).text(exp.title, { continued: true });
                    doc.font('Body').fontSize(10).text(`  ${exp.startDate} - ${exp.endDate}`, { align: 'right' });
                    doc.font('Body').fontSize(10).text(`${exp.company}, ${exp.location}`);
                    doc.moveDown(0.5);
                    exp.responsibilities.forEach(resp => {
                        if (resp.trim()) {
                            doc.font('Body').fontSize(10).text(`• ${resp}`, { 
                                indent: 10,
                                align: 'left',
                                width: pageWidth - 20,
                                columns: 1,
                                continued: false,
                                hangingIndent: 10 // Adjusted hanging indent
                            });
                        }
                    });
                    doc.moveDown(1);
                }
            });
        }

        // Projects Section
        if (data.projects.some(project => project.name)) {
            addSection('PROJECTS');
            data.projects.forEach(project => {
                doc.font('Heading').fontSize(12).text(project.name, { continued: true });
                doc.font('Body').fontSize(10).text(` | ${project.technologies}`, { continued: true });
                
                let linkText = '';
                if (project.githubLink) linkText += 'GitHub';
                if (project.link) linkText += linkText ? ' | Live' : 'Live';
                
                if (linkText) {
                    doc.text(`  (${linkText})`, { align: 'right' });
                } else {
                    doc.text('');
                }
                
                doc.moveDown(0.5);
                project.details.forEach(detail => {
                    if (detail.trim()) {
                        doc.font('Body').fontSize(10).text(`• ${detail}`, { 
                            indent: 10,
                            align: 'left',
                            width: pageWidth - 20,
                            columns: 1,
                            continued: false,
                            hangingIndent: 10 // Adjusted hanging indent
                        });
                    }
                });
                doc.moveDown(1);
            });
        }

        // Technical Skills Section
        addSection('TECHNICAL SKILLS');
        Object.entries(data.technicalSkills).forEach(([key, value]) => {
            if (value) {
                doc.font('Heading').fontSize(10).text(`${key.charAt(0).toUpperCase() + key.slice(1)}: `, { continued: true });
                doc.font('Body').text(value, { width: pageWidth });
            }
        });

        // Custom Sections
        if (data.customSections && data.customSections.length > 0) {
            data.customSections.forEach(section => {
                if (section.title && section.items && section.items.length > 0) {
                    addSection(section.title);
                    section.items.forEach(item => {
                        if (item.content) {
                            doc.font('Body').fontSize(10).text(`• ${item.content}`, { 
                                indent: 10,
                                align: 'left',
                                width: pageWidth - 20,
                                columns: 1,
                                continued: item.link ? true : false,
                                hangingIndent: 10 // Adjusted hanging indent
                            });
                            if (item.link) {
                                doc.text(` (${item.link})`, { link: item.link });
                            } else {
                                doc.text('');
                            }
                        }
                    });
                }
            });
        }

        // Finalize the PDF and create a new page if content overflows
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            
            // Add page number at the bottom
            const oldBottomMargin = doc.page.margins.bottom;
            doc.page.margins.bottom = 0
            doc.text(
                `Page ${i + 1} of ${pages.count}`,
                0,
                doc.page.height - 50,
                { align: 'center' }
            );
            doc.page.margins.bottom = oldBottomMargin;
        }

        doc.end();

        stream.on('finish', () => {
            resolve(pdfPath);
        });

        stream.on('error', reject);
    });
};



app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length === 0) return res.status(404).json({ message: "User doesn't exist." });
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.rows[0].password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid email or password." });

        const token = jwt.sign({ email: existingUser.rows[0].email, id: existingUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ name: existingUser.rows[0].name, token });
    } catch (error) {
        console.error("Error During Login", error);
        res.status(500).json({ message: "Server Error." });
    }
});

app.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if (existingUser.rows.length > 0) return res.status(409).json({ message: "User already exists." });
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [
            name, email, hashedPassword
        ]);
        const token = jwt.sign({ email: newUser.rows[0].email, id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.status(201).json({ name: newUser.rows[0].name, token });
    } catch (error) {
        console.error("Error During Signup", error);
        res.status(500).json({ message: "Server Error." });
    }
});

app.post('/submit', authenticateToken, async (req, res) => {
    let pdfPath;
    try {
        pdfPath = await generatePDF(req.body);
        res.download(pdfPath, 'resume.pdf', async (err) => {
            if (err) {
                console.error('Error downloading File', err);
                return res.status(500).json({ message: 'Error downloading File' });
            }
            try {
                await fsPromises.unlink(pdfPath);
            } catch (unlinkErr) {
                console.error('Error deleting File', unlinkErr);
            }
        });
    } catch (error) {
        console.error('Error generating PDF', error);
        if (pdfPath) {
            try {
                await fsPromises.unlink(pdfPath);
            } catch (unlinkErr) {
                console.error('Error deleting File', unlinkErr);
            }
        }
        res.status(500).json({ message: 'Server Error' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});