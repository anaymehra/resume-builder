import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Component() {
  const BASE_URL = 'https://resume-builder-wyqb.onrender.com';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    twitter: '',
    portfolio: '',
    education: [{ school: '', degree: '', location: '', startDate: '', endDate: '' }],
    experience: [{ title: '', company: '', location: '', startDate: '', endDate: '', responsibilities: [] }],
    projects: [{ name: '', technologies: '', startDate: '', endDate: '', details: [], link: '', githubLink: '' }],
    technicalSkills: { languages: '', frameworks: '', developerTools: '', libraries: '' },
    customSections: [{ title: '', items: [{ content: '', link: '' }] }]
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e, section, index, subfield, subIndex) => {
    const { name, value } = e.target;
    if (section) {
      if (subfield) {
        if (subIndex !== undefined) {
          setFormData(prev => ({
            ...prev,
            [section]: prev[section].map((item, i) => 
              i === index ? {
                ...item,
                [subfield]: item[subfield].map((subItem, si) =>
                  si === subIndex ? (typeof subItem === 'string' ? value : { ...subItem, [name]: value }) : subItem
                )
              } : item
            )
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [section]: prev[section].map((item, i) => 
              i === index ? { ...item, [subfield]: [...item[subfield], value] } : item
            )
          }));
        }
      } else if (Array.isArray(formData[section])) {
        setFormData(prev => ({
          ...prev,
          [section]: prev[section].map((item, i) => 
            i === index ? { ...item, [name]: value } : item
          )
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [section]: { ...prev[section], [name]: value }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (value.trim() !== '') {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addItem = (section) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], section === 'education' 
        ? { school: '', degree: '', location: '', startDate: '', endDate: '' }
        : section === 'experience'
        ? { title: '', company: '', location: '', startDate: '', endDate: '', responsibilities: [] }
        : section === 'projects'
        ? { name: '', technologies: '', startDate: '', endDate: '', details: [], link: '', githubLink: '' }
        : { title: '', items: [{ content: '', link: '' }] }
      ]
    }));
  };

  const addSubItem = (section, index, subfield) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [subfield]: [...item[subfield], subfield === 'items' ? { content: '', link: '' } : ''] } : item
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    ['name', 'email'].forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'This field is required';
      }
    });
    if (!formData.education[0].school.trim() || !formData.education[0].degree.trim()) {
      newErrors.education = 'At least one education entry is required';
    }
    if (!formData.technicalSkills.languages.trim()) {
      newErrors.technicalSkills = 'At least one language is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = 'resume.pdf';
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(downloadUrl);
        } else if (response.status === 401 || response.status === 403) {
          const error = { message: 'Please Login or SignUp.' };
          navigate('/auth', { state: error });
        } else {
          console.log('Error generating PDF');
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log('Form has errors');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
          Create Your Perfect Resume
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Easily create the perfect resume for any job using our best-in-class resume builder platform.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">LinkedIn</label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="github" className="block text-sm font-medium text-gray-700">GitHub</label>
              <input
                type="url"
                id="github"
                name="github"
                value={formData.github}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">Twitter</label>
              <input
                type="url"
                id="twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700">Portfolio</label>
              <input
                type="url"
                id="portfolio"
                name="portfolio"
                value={formData.portfolio}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                  onChange={(e) => handleChange(e, 'education', index)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <input
                  type="text"
                  name="degree"
                  placeholder="Degree *"
                  value={edu.degree}
                  onChange={(e) => handleChange(e, 'education', index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  required
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="text"
                    name="startDate"
                    placeholder="Start Date"
                    value={edu.startDate}
                    onChange={(e) => handleChange(e, 'education', index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                  <input
                    type="text"
                    name="endDate"
                    placeholder="End Date"
                    value={edu.endDate}
                    onChange={(e) => handleChange(e, 'education', index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            ))}
            {errors.education && <p className="mt-1 text-sm text-red-500">{errors.education}</p>}
            <button
              type="button"
              onClick={() => addItem('education')}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                  onChange={(e) => handleChange(e, 'experience', index)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => handleChange(e, 'experience', index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="text"
                    name="startDate"
                    placeholder="Start Date"
                    value={exp.startDate}
                    onChange={(e) => handleChange(e, 'experience', index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                  <input
                    type="text"
                    name="endDate"
                    placeholder="End Date"
                    value={exp.endDate}
                    onChange={(e) => handleChange(e, 'experience', index)}
                    className="block w-full px-3 py-2 bg-white border  border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                {exp.responsibilities.map((resp, respIndex) => (
                  <input
                    key={respIndex}
                    type="text"
                    placeholder={`Responsibility ${respIndex + 1}`}
                    value={resp}
                    onChange={(e) => handleChange(e, 'experience', index, 'responsibilities', respIndex)}
                    className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addSubItem('experience', index, 'responsibilities')}
                  className="mt-2 px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                >
                  Add Responsibility
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem('experience')}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                  onChange={(e) => handleChange(e, 'projects', index)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <input
                  type="text"
                  name="technologies"
                  placeholder="Technologies Used"
                  value={project.technologies}
                  onChange={(e) => handleChange(e, 'projects', index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <input
                  type="url"
                  name="link"
                  placeholder="Project Link"
                  value={project.link}
                  onChange={(e) => handleChange(e, 'projects', index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <input
                  type="url"
                  name="githubLink"
                  placeholder="GitHub Link"
                  value={project.githubLink}
                  onChange={(e) => handleChange(e, 'projects', index)}
                  className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="text"
                    name="startDate"
                    placeholder="Start Date"
                    value={project.startDate}
                    onChange={(e) => handleChange(e, 'projects', index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                  <input
                    type="text"
                    name="endDate"
                    placeholder="End Date"
                    value={project.endDate}
                    onChange={(e) => handleChange(e, 'projects', index)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                {project.details.map((detail, detailIndex) => (
                  <input
                    key={detailIndex}
                    type="text"
                    placeholder={`Project Detail ${detailIndex + 1}`}
                    value={detail}
                    onChange={(e) => handleChange(e, 'projects', index, 'details', detailIndex)}
                    className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addSubItem('projects', index, 'details')}
                  className="mt-2 px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                >
                  Add Project Detail
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem('projects')}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Add Project
            </button>
          </div>

          {/* Technical Skills */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Technical Skills</h2>
            <div>
              <label htmlFor="languages" className="block text-sm font-medium text-gray-700">Languages *</label>
              <input
                type="text"
                id="languages"
                name="languages"
                value={formData.technicalSkills.languages}
                onChange={(e) => handleChange(e, 'technicalSkills')}
                className={`mt-1 block w-full px-3 py-2 bg-white border ${errors.technicalSkills ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                required
              />
              {errors.technicalSkills && <p className="mt-1 text-sm text-red-500">{errors.technicalSkills}</p>}
            </div>
            <div className="mt-2">
              <label htmlFor="frameworks" className="block text-sm font-medium text-gray-700">Frameworks</label>
              <input
                type="text"
                id="frameworks"
                name="frameworks"
                value={formData.technicalSkills.frameworks}
                onChange={(e) => handleChange(e, 'technicalSkills')}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="mt-2">
              <label htmlFor="developerTools" className="block text-sm font-medium text-gray-700">Developer Tools</label>
              <input
                type="text"
                id="developerTools"
                name="developerTools"
                value={formData.technicalSkills.developerTools}
                onChange={(e) => handleChange(e, 'technicalSkills')}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="mt-2">
              <label htmlFor="libraries" className="block text-sm font-medium text-gray-700">Libraries</label>
              <input
                type="text"
                id="libraries"
                name="libraries"
                value={formData.technicalSkills.libraries}
                onChange={(e) => handleChange(e, 'technicalSkills')}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                  onChange={(e) => handleChange(e, 'customSections', index)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      name="content"
                      placeholder="Content"
                      value={item.content}
                      onChange={(e) => handleChange(e, 'customSections', index, 'items', itemIndex)}
                      className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                    <input
                      type="url"
                      name="link"
                      placeholder="Link (optional)"
                      value={item.link}
                      onChange={(e) => handleChange(e, 'customSections', index, 'items', itemIndex)}
                      className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSubItem('customSections', index, 'items')}
                  className="mt-2 px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                >
                  Add Item
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem('customSections')}
              className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Add Custom Section
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Create My Resume
          </button>
        </form>
      </div>
    </div>
  );
}