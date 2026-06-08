const Application = require('../models/Application');

const getMyApplications = async (req, res) => {
    try {
        const studentId = req.user.id;
        // Populate vacancy details so frontend can display them
        const applications = await Application.find({ studentId }).populate('vacancyId').sort({ createdAt: -1 });
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch applications", error: error.message });
    }
};

const getApplicationsByVacancy = async (req, res) => {
    try {
        const vacancyId = req.params.vacancyId;
        const applications = await Application.find({ vacancyId }).sort({ createdAt: -1 });
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch applications for this vacancy", error: error.message });
    }
};

const getAllApplications = async (req, res) => {
    try {
        const applications = await Application.find()
            .populate('vacancyId')
            .sort({ createdAt: -1 });
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch all applications", error: error.message });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const application = await Application.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('vacancyId');

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        res.status(200).json(application);
    } catch (error) {
        res.status(500).json({ message: "Failed to update application status", error: error.message });
    }
};

module.exports = {
    getMyApplications,
    getApplicationsByVacancy,
    getAllApplications,
    updateApplicationStatus
};
