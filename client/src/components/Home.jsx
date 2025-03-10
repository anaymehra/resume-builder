"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ClipboardCopyIcon, LightningBoltIcon, XIcon, CheckIcon } from "@heroicons/react/outline";

export default function Component() {
  const BASE_URL = "https://resume-builder-wyqb.onrender.com"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    twitter: "",
    portfolio: "",
    education: [{ school: "", degree: "", location: "", startDate: "", endDate: "" }],
    experience: [{ title: "", company: "", location: "", startDate: "", endDate: "", responsibilities: [] }],
    projects: [{ name: "", technologies: "", startDate: "", endDate: "", details: [], link: "", githubLink: "" }],
    technicalSkills: { languages: "", frameworks: "", developerTools: "", libraries: "" },
    customSections: [{ title: "", items: [{ content: "", link: "" }] }],
  })
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  // AI Assistant States
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiResponses, setAiResponses] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const messagesEndRef = useRef(null)

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [aiResponses])

  // Reset copied index after 2 seconds
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => {
        setCopiedIndex(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedIndex])

  const handleChange = (e, section, index, subfield, subIndex) => {
    const { name, value } = e.target
    if (section) {
      if (subfield) {
        if (subIndex !== undefined) {
          setFormData((prev) => ({
            ...prev,
            [section]: prev[section].map((item, i) =>
              i === index
                ? {
                    ...item,
                    [subfield]: item[subfield].map((subItem, si) =>
                      si === subIndex ? (typeof subItem === "string" ? value : { ...subItem, [name]: value }) : subItem,
                    ),
                  }
                : item,
            ),
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            [section]: prev[section].map((item, i) =>
              i === index ? { ...item, [subfield]: [...item[subfield], value] } : item,
            ),
          }))
        }
      } else if (Array.isArray(formData[section])) {
        setFormData((prev) => ({
          ...prev,
          [section]: prev[section].map((item, i) => (i === index ? { ...item, [name]: value } : item)),
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          [section]: { ...prev[section], [name]: value },
        }))
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    if (value.trim() !== "") {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const addItem = (section) => {
    setFormData((prev) => ({
      ...prev,
      [section]: [
        ...prev[section],
        section === "education"
          ? { school: "", degree: "", location: "", startDate: "", endDate: "" }
          : section === "experience"
            ? { title: "", company: "", location: "", startDate: "", endDate: "", responsibilities: [] }
            : section === "projects"
              ? { name: "", technologies: "", startDate: "", endDate: "", details: [], link: "", githubLink: "" }
              : { title: "", items: [{ content: "", link: "" }] },
      ],
    }))
  }

  const addSubItem = (section, index, subfield) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === index
          ? { ...item, [subfield]: [...item[subfield], subfield === "items" ? { content: "", link: "" } : ""] }
          : item,
      ),
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    ;["name", "email"].forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = "This field is required"
      }
    })
    if (!formData.education[0].school.trim() || !formData.education[0].degree.trim()) {
      newErrors.education = "At least one education entry is required"
    }
    if (!formData.technicalSkills.languages.trim()) {
      newErrors.technicalSkills = "At least one language is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateForm()) {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`${BASE_URL}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = downloadUrl
          link.download = "resume.pdf"
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(downloadUrl)
        } else if (response.status === 401 || response.status === 403) {
          const error = { message: "Please Login or SignUp." }
          navigate("/auth", { state: error })
        } else {
          console.log("Error generating PDF")
        }
      } catch (error) {
        console.log(error)
      }
    } else {
      console.log("Form has errors")
    }
  }

  // Mock AI response generation since the backend is not working
  const generateAIResponse = async () => {
    if (!aiPrompt.trim()) {
      return
    }

    setIsGenerating(true)

    // Add user message to chat
    setAiResponses((prev) => [...prev, { type: "user", content: aiPrompt }])

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate mock bullet points based on the prompt
      let bulletPoints = []

      if (aiPrompt.toLowerCase().includes("front end") || aiPrompt.toLowerCase().includes("developer")) {
        bulletPoints = [
          "Developed responsive web interfaces using HTML5, CSS3, and JavaScript, ensuring cross-browser compatibility and mobile responsiveness.",
          "Collaborated with a cross-functional team to implement user-centric design principles, resulting in a 25% improvement in user engagement metrics.",
          "Optimized website performance by implementing lazy loading and code splitting techniques, reducing load time by 40%.",
          "Integrated RESTful APIs to dynamically update content, enhancing user experience with real-time data.",
          "Utilized version control systems (Git) to maintain code integrity and facilitate collaborative development.",
        ]
      } else if (aiPrompt.toLowerCase().includes("project") || aiPrompt.toLowerCase().includes("application")) {
        bulletPoints = [
          "Architected and developed a full-stack web application using React.js and Node.js, resulting in a scalable solution with 99.9% uptime.",
          "Implemented secure user authentication and authorization using JWT, protecting sensitive user data and ensuring GDPR compliance.",
          "Designed and optimized database schemas in PostgreSQL, improving query performance by 35% through proper indexing.",
          "Deployed and maintained CI/CD pipelines using GitHub Actions, reducing deployment time by 60% and minimizing production errors.",
          "Conducted thorough testing using Jest and React Testing Library, achieving 90% code coverage and reducing post-release bugs by 45%.",
        ]
      } else {
        bulletPoints = [
          "Leveraged analytical skills to identify process inefficiencies and implement solutions that increased operational productivity by 30%.",
          "Demonstrated strong communication skills by effectively presenting complex technical concepts to non-technical stakeholders.",
          "Managed multiple concurrent projects with competing deadlines, consistently delivering high-quality results on time and within budget.",
          "Utilized data-driven decision making to optimize resource allocation, resulting in 20% cost savings.",
          "Proactively identified and resolved potential issues before they impacted project timelines or deliverables.",
        ]
      }

      // Add AI response to chat
      setAiResponses((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Here are some ATS-friendly bullet points for your resume:",
          bulletPoints: bulletPoints,
        },
      ])

      // Clear the prompt
      setAiPrompt("")
    } catch (error) {
      console.error("Error generating content:", error)
      setAiResponses((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "I'm sorry, I encountered an error while generating content. Please try again.",
          isError: true,
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyBulletPoint = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">Create Your Perfect Resume</h1>
        <p className="text-center text-gray-600 mb-8">
          Easily create the perfect resume for any job using our best-in-class resume builder platform.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                LinkedIn
              </label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="github" className="block text-sm font-medium text-gray-700">
                GitHub
              </label>
              <input
                type="url"
                id="github"
                name="github"
                value={formData.github}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                Twitter
              </label>
              <input
                type="url"
                id="twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700">
                Portfolio
              </label>
              <input
                type="url"
                id="portfolio"
                name="portfolio"
                value={formData.portfolio}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Education */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Education *</h2>
            {formData.education.map((edu, index) => (
              <div key={index} className="mb-4 p-4 border rounded">
                <input
                  type="text"
                  name="school"
                  placeholder="School *"
                  value={edu.school}
                  onChange={(e) => handleChange(e, "education", index)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="text"
                  name="degree"
                  placeholder="Degree *"
                  value={edu.degree}
                  onChange={(e) => handleChange(e, "education", index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="text"
                    name="startDate"
                    placeholder="Start Date"
                    value={edu.startDate}
                    onChange={(e) => handleChange(e, "education", index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    name="endDate"
                    placeholder="End Date"
                    value={edu.endDate}
                    onChange={(e) => handleChange(e, "education", index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
            {errors.education && <p className="mt-1 text-sm text-red-500">{errors.education}</p>}
            <button
              type="button"
              onClick={() => addItem("education")}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Education
            </button>
          </div>

          {/* Experience */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Experience</h2>
            {formData.experience.map((exp, index) => (
              <div key={index} className="mb-4 p-4 border rounded">
                <input
                  type="text"
                  name="title"
                  placeholder="Job Title"
                  value={exp.title}
                  onChange={(e) => handleChange(e, "experience", index)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => handleChange(e, "experience", index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="text"
                    name="startDate"
                    placeholder="Start Date"
                    value={exp.startDate}
                    onChange={(e) => handleChange(e, "experience", index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    name="endDate"
                    placeholder="End Date"
                    value={exp.endDate}
                    onChange={(e) => handleChange(e, "experience", index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {exp.responsibilities.map((resp, respIndex) => (
                  <input
                    key={respIndex}
                    type="text"
                    placeholder={`Responsibility ${respIndex + 1}`}
                    value={resp}
                    onChange={(e) => handleChange(e, "experience", index, "responsibilities", respIndex)}
                    className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addSubItem("experience", index, "responsibilities")}
                  className="mt-2 px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                >
                  Add Responsibility
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem("experience")}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Experience
            </button>
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Projects</h2>
            {formData.projects.map((project, index) => (
              <div key={index} className="mb-4 p-4 border rounded">
                <input
                  type="text"
                  name="name"
                  placeholder="Project Name"
                  value={project.name}
                  onChange={(e) => handleChange(e, "projects", index)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="technologies"
                  placeholder="Technologies Used"
                  value={project.technologies}
                  onChange={(e) => handleChange(e, "projects", index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="url"
                  name="link"
                  placeholder="Project Link"
                  value={project.link}
                  onChange={(e) => handleChange(e, "projects", index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="url"
                  name="githubLink"
                  placeholder="GitHub Link"
                  value={project.githubLink}
                  onChange={(e) => handleChange(e, "projects", index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="text"
                    name="startDate"
                    placeholder="Start Date"
                    value={project.startDate}
                    onChange={(e) => handleChange(e, "projects", index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    name="endDate"
                    placeholder="End Date"
                    value={project.endDate}
                    onChange={(e) => handleChange(e, "projects", index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {project.details.map((detail, detailIndex) => (
                  <input
                    key={detailIndex}
                    type="text"
                    placeholder={`Project Detail ${detailIndex + 1}`}
                    value={detail}
                    onChange={(e) => handleChange(e, "projects", index, "details", detailIndex)}
                    className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addSubItem("projects", index, "details")}
                  className="mt-2 px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                >
                  Add Project Detail
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem("projects")}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Project
            </button>
          </div>

          {/* Technical Skills */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Technical Skills</h2>
            <div>
              <label htmlFor="languages" className="block text-sm font-medium text-gray-700">
                Languages *
              </label>
              <input
                type="text"
                id="languages"
                name="languages"
                value={formData.technicalSkills.languages}
                onChange={(e) => handleChange(e, "technicalSkills")}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${errors.technicalSkills ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                required
              />
              {errors.technicalSkills && <p className="mt-1 text-sm text-red-500">{errors.technicalSkills}</p>}
            </div>
            <div className="mt-2">
              <label htmlFor="frameworks" className="block text-sm font-medium text-gray-700">
                Frameworks
              </label>
              <input
                type="text"
                id="frameworks"
                name="frameworks"
                value={formData.technicalSkills.frameworks}
                onChange={(e) => handleChange(e, "technicalSkills")}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-2">
              <label htmlFor="developerTools" className="block text-sm font-medium text-gray-700">
                Developer Tools
              </label>
              <input
                type="text"
                id="developerTools"
                name="developerTools"
                value={formData.technicalSkills.developerTools}
                onChange={(e) => handleChange(e, "technicalSkills")}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-2">
              <label htmlFor="libraries" className="block text-sm font-medium text-gray-700">
                Libraries
              </label>
              <input
                type="text"
                id="libraries"
                name="libraries"
                value={formData.technicalSkills.libraries}
                onChange={(e) => handleChange(e, "technicalSkills")}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Custom Sections */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Custom Sections</h2>
            {formData.customSections.map((section, index) => (
              <div key={index} className="mb-4 p-4 border rounded">
                <input
                  type="text"
                  name="title"
                  placeholder="Section Title"
                  value={section.title}
                  onChange={(e) => handleChange(e, "customSections", index)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      name="content"
                      placeholder="Content"
                      value={item.content}
                      onChange={(e) => handleChange(e, "customSections", index, "items", itemIndex)}
                      className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="url"
                      name="link"
                      placeholder="Link (optional)"
                      value={item.link}
                      onChange={(e) => handleChange(e, "customSections", index, "items", itemIndex)}
                      className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSubItem("customSections", index, "items")}
                  className="mt-2 px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                >
                  Add Item
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem("customSections")}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Custom Section
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create My Resume
          </button>
        </form>
      </div>

      {/* AI Assistant Button (Fixed in corner) */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ${isAssistantOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <LightningBoltIcon className="w-8 h-8" />
      </button>

      {/* AI Assistant Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-xl transition-transform duration-300 transform ${isAssistantOpen ? "translate-x-0" : "translate-x-full"} flex flex-col z-50`}
      >
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h3 className="text-lg font-semibold flex items-center">
            <LightningBoltIcon className="w-5 h-5 mr-2" />
            Resume AI Assistant
          </h3>
          <button
            onClick={() => setIsAssistantOpen(false)}
            className="p-1 rounded-full hover:bg-blue-700 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {aiResponses.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="mb-2">Ask me to help with your resume!</p>
              <p className="text-sm">
                I can generate ATS-friendly bullet points for your experiences, projects, and skills.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {aiResponses.map((response, index) => (
                <div
                  key={index}
                  className={`${response.type === "user" ? "ml-auto bg-blue-100 text-blue-800" : "mr-auto bg-white text-gray-800"} p-3 rounded-lg shadow max-w-[85%] ${response.isError ? "bg-red-50 text-red-600" : ""}`}
                >
                  <p>{response.content}</p>

                  {response.bulletPoints && (
                    <div className="mt-2 space-y-2">
                      {response.bulletPoints.map((bullet, bulletIndex) => (
                        <div
                          key={bulletIndex}
                          className="flex items-start bg-gray-50 p-2 rounded group hover:bg-gray-100"
                        >
                          <p className="flex-1 text-sm">{bullet}</p>
                          <button
                            onClick={() => handleCopyBulletPoint(bullet, `${index}-${bulletIndex}`)}
                            className="ml-2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy to clipboard"
                          >
                            {copiedIndex === `${index}-${bulletIndex}` ? (
                              <CheckIcon className="w-5 h-5 text-green-500" />
                            ) : (
                              <ClipboardCopyIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="relative">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask for ATS-friendly bullet points..."
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isGenerating) {
                  e.preventDefault()
                  generateAIResponse()
                }
              }}
              disabled={isGenerating}
            />
            <button
              onClick={generateAIResponse}
              disabled={isGenerating || !aiPrompt.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              {isGenerating ? (
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            I'll always provide ATS-friendly bullet points that highlight your achievements and skills.
          </p>
        </div>
      </div>
    </div>
  )
}

