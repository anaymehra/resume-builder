import express from "express"
import cors from "cors"
import pkg from "pg"
import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import PDFDocument from "pdfkit"
import fs from "fs"
import { promises as fsPromises } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const { Pool } = pkg
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const allowedOrigins = ["https://resume-builder-nu-gray.vercel.app", "http://localhost:3000"]

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["POST", "GET"],
    credentials: true,
  }),
)

app.use(express.json())

// Database Connection
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
})

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

// Generate PDF
const generatePDF = async (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, left: 50, right: 50, bottom: 50 },
      bufferPages: true,
    })

    const pdfPath = path.join(__dirname, "resume.pdf")
    const stream = fs.createWriteStream(pdfPath)
    doc.pipe(stream)

    // Register fonts
    const fontPath = path.join(__dirname, "fonts")
    doc.registerFont("Heading", path.join(fontPath, "TimesNewRoman-Bold.ttf"))
    doc.registerFont("Body", path.join(fontPath, "Arial.ttf"))

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right

    // Name - larger and centered
    doc.font("Heading").fontSize(24).text(data.name, { align: "center" })

    // Contact info in one line
    doc.moveDown(0.5)
    const contactInfo = []
    if (data.email) contactInfo.push(data.email)
    if (data.phone) contactInfo.push(data.phone)

    doc.font("Body").fontSize(10).text(contactInfo.join(" | "), { align: "center" })

    // Social links in one line
    const socialLinks = [
      { text: "Portfolio", link: data.portfolio },
      { text: "GitHub", link: data.github },
      { text: "LinkedIn", link: data.linkedin },
      { text: "Twitter", link: data.twitter },
    ].filter((item) => item.link)

    if (socialLinks.length > 0) {
      doc.moveDown(0.2)
      doc.font("Body").fontSize(10)

      const socialText = socialLinks.map((item) => item.text).join(" | ")
      const startX = (pageWidth - doc.widthOfString(socialText)) / 2
      let currentX = startX

      socialLinks.forEach((item, index) => {
        doc.fillColor("blue").text(item.text, currentX, doc.y, {
          link: item.link,
          underline: true,
          continued: index < socialLinks.length - 1,
        })
        currentX += doc.widthOfString(item.text)
        if (index < socialLinks.length - 1) {
          doc.fillColor("black").text(" | ", { continued: true })
          currentX += doc.widthOfString(" | ")
        }
      })
    }

    doc.fillColor("black").moveDown(1.5)

    const addSection = (title) => {
      doc.moveDown(0.5)
      doc.font("Heading").fontSize(14).text(title.toUpperCase())
      doc.moveDown(0.5)
    }

    // Education Section
    addSection("EDUCATION")
    data.education.forEach((edu) => {
      if (edu.school) {
        doc.font("Heading").fontSize(12).text(edu.school, { continued: true })
        if (edu.startDate || edu.endDate) {
          const dateText = `${edu.startDate || ""} - ${edu.endDate || ""}`
          const dateWidth = doc.widthOfString(dateText)
          const schoolWidth = doc.widthOfString(edu.school)
          const spacing = pageWidth - schoolWidth - dateWidth
          doc.text("", { continued: true })
          for (let i = 0; i < spacing; i += 4) {
            doc.text(" ", { continued: true })
          }
          doc.text(dateText)
        } else {
          doc.text("")
        }

        if (edu.degree) {
          doc.font("Body").fontSize(10).text(edu.degree)
        }
        doc.moveDown(0.5)
      }
    })

    // Experience Section
    if (data.experience.some((exp) => exp.title || exp.company)) {
      addSection("EXPERIENCE")
      data.experience.forEach((exp) => {
        if (exp.title || exp.company) {
          // Title and date on the same line
          if (exp.title) {
            doc.font("Heading").fontSize(12).text(exp.title, { continued: true })
          }
          if (exp.company) {
            doc.text(exp.title ? ` | ${exp.company}` : exp.company, { continued: true })
          }
          if (exp.location) {
            doc.text(` ${exp.location}`, { continued: true })
          }

          if (exp.startDate || exp.endDate) {
            const dateText = `${exp.startDate || ""} - ${exp.endDate || ""}`
            const titleText = `${exp.title || ""}${exp.company ? ` | ${exp.company}` : ""}${exp.location ? ` ${exp.location}` : ""}`
            const dateWidth = doc.widthOfString(dateText)
            const titleWidth = doc.widthOfString(titleText)
            const spacing = pageWidth - titleWidth - dateWidth

            if (spacing > 0) {
              doc.text("", { continued: true })
              for (let i = 0; i < spacing; i += 4) {
                doc.text(" ", { continued: true })
              }
            } else {
              doc.text(" | ", { continued: true })
            }

            doc.text(dateText)
          } else {
            doc.text("")
          }

          doc.moveDown(0.5)

          // Responsibilities as bullet points
          exp.responsibilities.forEach((resp) => {
            if (resp.trim()) {
              doc
                .font("Body")
                .fontSize(10)
                .text(`• ${resp}`, {
                  indent: 10,
                  align: "left",
                  width: pageWidth - 20,
                  continued: false,
                })
            }
          })
          doc.moveDown(0.5)
        }
      })
    }

    // Skills Section
    if (Object.values(data.technicalSkills).some((value) => value)) {
      addSection("SKILLS")

      Object.entries(data.technicalSkills).forEach(([key, value]) => {
        if (value) {
          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
          doc.font("Heading").fontSize(10).text(`${formattedKey}: `, { continued: true })
          doc.font("Body").text(value)
        }
      })

      doc.moveDown(0.5)
    }

    // Projects Section
    if (data.projects.some((project) => project.name)) {
      addSection("PROJECTS/OPEN-SOURCE")
      data.projects.forEach((project) => {
        if (project.name) {
          // Project name and links on the same line
          doc.font("Heading").fontSize(12).text(project.name, { continued: true })

          // Add links
          const links = []
          if (project.githubLink) {
            links.push({ text: "GitHub", link: project.githubLink })
          }
          if (project.link) {
            links.push({ text: "Link", link: project.link })
          }

          if (links.length > 0) {
            doc.text(" | ", { continued: true })

            links.forEach((item, index) => {
              doc.fillColor("blue").text(item.text, {
                link: item.link,
                underline: true,
                continued: index < links.length - 1,
              })

              if (index < links.length - 1) {
                doc.text(", ", { continued: true })
              }
            })

            doc.fillColor("black")
          }

          // Add technologies
          if (project.technologies) {
            doc.text(links.length > 0 ? " " : " | ", { continued: true })
            doc.text(project.technologies)
          } else {
            doc.text("")
          }

          // Project details as bullet points
          project.details.forEach((detail) => {
            if (detail.trim()) {
              doc
                .font("Body")
                .fontSize(10)
                .text(`• ${detail}`, {
                  indent: 10,
                  align: "left",
                  width: pageWidth - 20,
                  continued: false,
                })
            }
          })
          doc.moveDown(0.5)
        }
      })
    }

    // Custom Sections
    if (data.customSections && data.customSections.length > 0) {
      data.customSections.forEach((section) => {
        if (section.title && section.items && section.items.length > 0 && section.items.some((item) => item.content)) {
          addSection(section.title.toUpperCase())

          section.items.forEach((item) => {
            if (item.content) {
              if (item.link) {
                doc.font("Body").fontSize(10).text(`• ${item.content} `, {
                  indent: 10,
                  continued: true,
                })

                doc.fillColor("blue").text(item.link, {
                  link: item.link,
                  underline: true,
                })

                doc.fillColor("black")
              } else {
                doc.font("Body").fontSize(10).text(`• ${item.content}`, { indent: 10 })
              }
            }
          })

          doc.moveDown(0.5)
        }
      })
    }

    doc.end()

    stream.on("finish", () => {
      resolve(pdfPath)
    })

    stream.on("error", reject)
  })
}

app.post("/login", async (req, res) => {
  const { email, password } = req.body
  try {
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email])
    if (existingUser.rows.length === 0) return res.status(404).json({ message: "User doesn't exist." })
    const isPasswordCorrect = await bcrypt.compare(password, existingUser.rows[0].password)
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid email or password." })

    const token = jwt.sign({ email: existingUser.rows[0].email, id: existingUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })

    res.status(200).json({ name: existingUser.rows[0].name, token })
  } catch (error) {
    console.error("Error During Login", error)
    res.status(500).json({ message: "Server Error." })
  }
})

app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body
  try {
    const existingUser = await pool.query("SELECT * FROM users WHERE email=$1", [email])
    if (existingUser.rows.length > 0) return res.status(409).json({ message: "User already exists." })

    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = await pool.query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *", [
      name,
      email,
      hashedPassword,
    ])
    const token = jwt.sign({ email: newUser.rows[0].email, id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })
    res.status(201).json({ name: newUser.rows[0].name, token })
  } catch (error) {
    console.error("Error During Signup", error)
    res.status(500).json({ message: "Server Error." })
  }
})

app.post("/submit", authenticateToken, async (req, res) => {
  let pdfPath
  try {
    pdfPath = await generatePDF(req.body)
    res.download(pdfPath, "resume.pdf", async (err) => {
      if (err) {
        console.error("Error downloading File", err)
        return res.status(500).json({ message: "Error downloading File" })
      }
      try {
        await fsPromises.unlink(pdfPath)
      } catch (unlinkErr) {
        console.error("Error deleting File", unlinkErr)
      }
    })
  } catch (error) {
    console.error("Error generating PDF", error)
    if (pdfPath) {
      try {
        await fsPromises.unlink(pdfPath)
      } catch (unlinkErr) {
        console.error("Error deleting File", unlinkErr)
      }
    }
    res.status(500).json({ message: "Server Error" })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

