const { Submission } = require('../utils/db');

const createSubmission = async (contestId, teamId, fileURL) => {
    try {
        const submission = new Submission({
            contest: contestId,
            teamId: teamId,
            fileURL: fileURL,
            submittedAt : Date.now()
        });
        return await submission.save();
    }
    catch (err) {
        console.error(err);
        throw new Error("Error creating submission");
    }
};

const getSubmission = async (submissionId) => {
    try {
        return await Submission.findById(submissionId);
    }
    catch (err) {
        throw new Error("Error fetching submission");
    }
};

const getContestSubmissions = async (contestId) => {
    try {
        return await Submission.find({ contest: contestId });
    }
    catch (err) {
        throw new Error("Error fetching contest submissions");
    }
};

const getTeamSubmission = async (teamId) => {
    try {
        return await Submission.findOne({ teamId: teamId });
    }
    catch (err) {
        throw new Error("Error fetching team submission");
    }
};

const evaluateSubmission = async (submissionId, score, feedback) => {
    try {
        return await Submission.findByIdAndUpdate(
            submissionId,
            {
                score: score,
                feedback: feedback,
                evaluationStatus: "evaluated"
            },
            { new: true }
        );
    }
    catch (err) {
        throw new Error("Error evaluating submission");
    }
};

const deleteSubmission = async (submissionId) => {
    try {
        return await Submission.findByIdAndDelete(submissionId);
    }
    catch (err) {
        throw new Error("Error deleting submission");
    }
};

module.exports = {
    createSubmission,
    getSubmission,
    getContestSubmissions,
    getTeamSubmission,
    evaluateSubmission,
    deleteSubmission
};