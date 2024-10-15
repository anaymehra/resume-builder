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
    "https://resume-builder-nu-gray.vercel.app",
    "http://localhost:3000" // Add localhost for local testing
  ];
  
  app.use(cors({
    origin: allowedOrigins,
    methods: ["POST"],
    credentials: true,
  }));

  app.use(express.json());
  
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
            margins: { top: 72, left: 72, right: 72, bottom: 72 }
        });

        const pdfPath = path.join(__dirname, 'resume.pdf');
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Register fonts
        const fontPath = path.join(__dirname, 'fonts');
        doc.registerFont('Heading', path.join(fontPath, 'TimesNewRoman-Bold.ttf'));
        doc.registerFont('Body', path.join(fontPath, 'Arial.ttf'));

        // Name
        doc.font('Heading').fontSize(24).text(data.name, { align: 'center' });
        
        // Contact info
        const contactInfo = [
            data.email,
            data.phone,
            { text: 'LinkedIn', link: data.linkedin },
            { text: 'GitHub', link: data.github },
            { text: 'Twitter', link: data.twitter },
            { text: 'Portfolio', link: data.portfolio }
        ].filter(item => item && (typeof item === 'string' ? item.trim() : item.link.trim()));

        doc.font('Body').fontSize(10);
        let xPos = doc.page.width / 2;
        contactInfo.forEach((item, index) => {
            if (typeof item === 'string') {
                doc.text(item, xPos, doc.y, { align: 'center' });
            } else {
                doc.fillColor('blue').text(item.text, xPos, doc.y, { align: 'center', link: item.link, underline: true });
            }
            if (index < contactInfo.length - 1) {
                doc.fillColor('black').text(' | ', xPos, doc.y, { align: 'center' });
            }
        });
        doc.fillColor('black');
        
        const addSection = (title, githubLink) => {
            doc.moveDown(1.5);
            doc.font('Heading').fontSize(14).text(title.toUpperCase(), { underline: true });
            if (githubLink) {
                doc.fontSize(10).fillColor('blue').text('GitHub', { link: githubLink, align: 'right', continued: true })
                   .fillColor('black').text(' | ', { align: 'right', continued: true })
                   .fillColor('blue').text('Live', { link: githubLink, align: 'right' });
            }
            doc.moveDown(0.5);
        };

        // Education
        addSection('EDUCATION');
        data.education.forEach(edu => {
            doc.font('Heading').fontSize(12).text(edu.school);
            doc.font('Body').fontSize(10).text(`${edu.degree}`);
            doc.font('Body').fontSize(10).text(`${edu.startDate} - ${edu.endDate}`, { align: 'right' });
            doc.moveDown(0.5);
        });

        // Experience
        if (data.experience.some(exp => exp.title || exp.company)) {
            addSection('EXPERIENCE');
            data.experience.forEach(exp => {
                if (exp.title || exp.company) {
                    doc.font('Heading').fontSize(12).text(exp.title);
                    doc.font('Body').fontSize(10).text(`${exp.company}, ${exp.location}`);
                    doc.font('Body').fontSize(10).text(`${exp.startDate} - ${exp.endDate}`, { align: 'right' });
                    exp.responsibilities.forEach(resp => {
                        if (resp.trim()) {
                            doc.font('Body').fontSize(10).text(`• ${resp}`, { indent: 20 });
                        }
                    });
                    doc.moveDown(0.5);
                }
            });
        }

        // Projects
        addSection('PROJECTS');
        data.projects.forEach(project => {
            doc.font('Heading').fontSize(12).text(project.name, { continued: true });
            if (project.githubLink) {
                doc.fillColor('blue').text('GitHub', { link: project.githubLink, underline: true });
                if (project.link) doc.fillColor('black').text(' | ');
            }
            if (project.link) {
                doc.fillColor('blue').text('Live', { link: project.link, underline: true });
            }
            doc.fillColor('black').text('');
            doc.font('Body').fontSize(10).text(`Technologies: ${project.technologies}`);
            doc.font('Body').fontSize(10).text(`${project.startDate} - ${project.endDate}`, { align: 'right' });
            project.details.forEach(detail => {
                if (detail.trim()) {
                    doc.font('Body').fontSize(10).text(`• ${detail}`, { indent: 20 });
                }
            });
            doc.moveDown(0.5);
        });

        // Technical Skills
        addSection('TECHNICAL SKILLS');
        Object.entries(data.technicalSkills).forEach(([key, value]) => {
            if (value) {
                doc.font('Heading').fontSize(10).text(`${key.charAt(0).toUpperCase() + key.slice(1)}: `, { continued: true });
                doc.font('Body').text(value);
            }
        });

        // Custom Sections
        data.customSections.forEach(section => {
            addSection(section.title);
            section.items.forEach(item => {
                if (item.content.trim()) {
                    if (item.link) {
                        doc.font('Body').fontSize(10).text(`• `, { continued: true })
                           .fillColor('blue').text(item.content, { link: item.link, underline: true });
                    } else {
                        doc.font('Body').fontSize(10).text(`• ${item.content}`);
                    }
                }
            });
        });

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
