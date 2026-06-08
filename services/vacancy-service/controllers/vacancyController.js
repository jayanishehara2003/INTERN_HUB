const Vacancy = require('../models/vacancy');
const Application = require('../models/Application');

const convertToEndOfDay = (dateString) => {
  const date = new Date(dateString);
  date.setHours(23, 59, 59, 999);
  return date;
};

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// Create a new vacancy
const createVacancy = async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      location,
      deadline,
      imageUrl,
      salary,
      jobType,
      skills,
      applicationUrl
    } = req.body;

    const postedBy = req.user.id;

    if (!title || !company) {
      return res.status(400).json({
        message: 'Title and company are required.'
      });
    }

    if (!deadline) {
      return res.status(400).json({
        message: 'Deadline is required.'
      });
    }

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        message: 'At least one skill is required.'
      });
    }

    const cleanedSkills = skills
      .map((skill) => String(skill).trim())
      .filter((skill) => skill !== '');

    if (cleanedSkills.length === 0) {
      return res.status(400).json({
        message: 'At least one valid skill is required.'
      });
    }

    if (applicationUrl && !isValidUrl(applicationUrl)) {
      return res.status(400).json({
        message: 'Please enter a valid application URL.'
      });
    }

    const formattedDeadline = convertToEndOfDay(deadline);

    if (formattedDeadline < new Date()) {
      return res.status(400).json({
        message: 'Deadline cannot be in the past.'
      });
    }

    const newVacancy = new Vacancy({
      title: title.trim(),
      company: company.trim(),
      description: description || '',
      location: location || '',
      deadline: formattedDeadline,
      postedBy,
      imageUrl: imageUrl || '',
      salary: salary || '',
      jobType: jobType || 'Internship',
      skills: cleanedSkills,
      applicationUrl: applicationUrl || ''
      // viewCount will start from model default value
    });

    const savedVacancy = await newVacancy.save();
    res.status(201).json(savedVacancy);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create vacancy',
      error: error.message
    });
  }
};

// Get only visible vacancies for users
const getVisibleVacancies = async (req, res) => {
  try {
    const now = new Date();

    const vacancies = await Vacancy.find({
      deadline: { $gte: now }
    }).sort({ createdAt: -1 });

    res.status(200).json(vacancies);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch vacancies',
      error: error.message
    });
  }
};

// Get all vacancies for admin
const getAllVacancies = async (req, res) => {
  try {
    const vacancies = await Vacancy.find().sort({ createdAt: -1 });
    res.status(200).json(vacancies);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch vacancies',
      error: error.message
    });
  }
};

// Get a single vacancy by ID
const getVacancyById = async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);

    if (!vacancy) {
      return res.status(404).json({
        message: 'Vacancy not found'
      });
    }

    res.status(200).json(vacancy);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch vacancy',
      error: error.message
    });
  }
};

// Increment vacancy view count
const incrementVacancyView = async (req, res) => {
  try {
    const updatedVacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!updatedVacancy) {
      return res.status(404).json({
        message: 'Vacancy not found'
      });
    }

    res.status(200).json(updatedVacancy);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update vacancy view count',
      error: error.message
    });
  }
};

// Update a vacancy
const updateVacancy = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.deadline) {
      const formattedDeadline = convertToEndOfDay(updateData.deadline);

      if (formattedDeadline < new Date()) {
        return res.status(400).json({
          message: 'Deadline cannot be in the past.'
        });
      }

      updateData.deadline = formattedDeadline;
    }

    if (updateData.skills) {
      if (!Array.isArray(updateData.skills) || updateData.skills.length === 0) {
        return res.status(400).json({
          message: 'At least one skill is required.'
        });
      }

      const cleanedSkills = updateData.skills
        .map((skill) => String(skill).trim())
        .filter((skill) => skill !== '');

      if (cleanedSkills.length === 0) {
        return res.status(400).json({
          message: 'At least one valid skill is required.'
        });
      }

      updateData.skills = cleanedSkills;
    }

    if (
      Object.prototype.hasOwnProperty.call(updateData, 'applicationUrl') &&
      updateData.applicationUrl &&
      !isValidUrl(updateData.applicationUrl)
    ) {
      return res.status(400).json({
        message: 'Please enter a valid application URL.'
      });
    }

    const updatedVacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedVacancy) {
      return res.status(404).json({
        message: 'Vacancy not found'
      });
    }

    res.status(200).json(updatedVacancy);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update vacancy',
      error: error.message
    });
  }
};

// Delete a vacancy
const deleteVacancy = async (req, res) => {
  try {
    const deletedVacancy = await Vacancy.findByIdAndDelete(req.params.id);

    if (!deletedVacancy) {
      return res.status(404).json({
        message: 'Vacancy not found'
      });
    }

    res.status(200).json({
      message: 'Vacancy deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete vacancy',
      error: error.message
    });
  }
};

// Apply for a vacancy
const applyVacancy = async (req, res) => {
  try {
    const vacancyId = req.params.id;
    const studentId = req.user.id;
    const studentName = req.user.name;

    const vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) {
      return res.status(404).json({
        message: 'Vacancy not found'
      });
    }

    if (new Date(vacancy.deadline) < new Date()) {
      return res.status(400).json({
        message: 'This vacancy has expired.'
      });
    }

    const existingApplication = await Application.findOne({
      vacancyId,
      studentId
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'You have already applied for this vacancy.'
      });
    }

    const { email, phone, coverLetter } = req.body;
    const cvUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!email || !phone || !cvUrl) {
      return res.status(400).json({
        message: 'Email, phone, and CV are required.'
      });
    }

    const newApplication = new Application({
      studentId,
      studentName,
      vacancyId,
      email,
      phone,
      coverLetter,
      cvUrl
    });

    const savedApplication = await newApplication.save();
    res.status(201).json(savedApplication);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to apply for vacancy',
      error: error.message
    });
  }
};

module.exports = {
  createVacancy,
  getVisibleVacancies,
  getAllVacancies,
  getVacancyById,
  incrementVacancyView,
  updateVacancy,
  deleteVacancy,
  applyVacancy
};