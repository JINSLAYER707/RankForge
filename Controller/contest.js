const express = require('express');
const contestRouter = express.Router();

const { Contest, User, Submission } = require('../utils/db');

const User_M = require('../Models/User_M');
const Contest_M = require('../Models/Contest_M');
const Submission_M = require('../Models/Submission_M');

const upload = require('../utils/multer');


/* =======================
   ALL CONTESTS PAGE
======================= */

contestRouter.get('/contest', async (req, res) => {
    const update=await Contest_M.updateStatus();
    const contests = await Contest.find().populate('hostedBy', 'name email');

    res.render('contests', { contests });

});


/* =======================
   CONTEST DETAILS PAGE
======================= */

contestRouter.get('/contest/:id', async (req, res) => {

    const contestId = req.params.id;
    const userId = req.session.userId;
    const contest = await Contest_M.getContest(contestId);

    if (!contest) {
        return res.status(404).send("Contest not found");
    }

    const leaderboard = [...contest.teams]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    const submissions = leaderboard.map(team => ({
        teamName: team.name,
        file: team.submission?.fileURL,
        date: team.submission?.submittedAt,
        score: team.score
    }));


    const user = await User.findById(userId)
        .populate('participatedContests')
        .populate('hostedContests');

    if (!user) {
        return res.redirect('/login');
    }


    /* =======================
       HOST VIEW
    ======================= */

    if (contest.hostedBy._id.toString() === userId) {
        const teams = contest.teams;
        const submissions = teams.map(team => team.submission);
        const fsub = await Promise.all(
            submissions.map((sub) => {
                return Submission.findById(sub);
            })
        );
        const totalParticipants = contest.teams.reduce(
            (total, team) => total + team.members.length + 1,
            0
        );
        const evaluated = fsub.filter(
            s => s && s.score !== null
        ).length;
        const pending = fsub.filter(
            s => !s || s.score === null
        ).length;
        return res.render('contestD_host', {
            contest,
            teams,
            submissions: fsub,
            totalParticipants,
            evaluatedCount: evaluated,
            pendingCount: pending
        });
    }


    /* =======================
       PARTICIPANT VIEW
    ======================= */

    const myTeam = contest.teams.find(team =>
        team.leader._id.toString() === userId ||
        team.members.some(m => m._id.toString() === userId)
    );

    if (myTeam) {

        const myTeamId = myTeam._id;
        

        let mySubmissions = [];

        if (myTeam.submission) {
            const submission = await Submission.findById(myTeam.submission);
            if (submission) {
                mySubmissions = [submission];
            }
        }

        return res.render('contestD_part', {
            contest,
            team: myTeam,
            teams: contest.teams,
            submissions: mySubmissions,
            myTeamId
        });
    }


    /* =======================
       PUBLIC VIEW
    ======================= */

    res.render('contestDetails', {
        contest,
        teams: leaderboard,
        submissions
    });

});


/* =======================
   SEARCH CONTEST
======================= */

contestRouter.post('/contest', async (req, res) => {

    const { contest_id, name } = req.body;

    let contest;

    if (contest_id) {
        contest = await Contest_M.getContest(contest_id);
    }
    else {
        contest = await Contest.findOne({ name });
    }

    if (!contest) {
        return res.status(404).send("Contest not found");
    }

    const leaderboard = [...contest.teams]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    const submissions = leaderboard.map(team => ({
        teamName: team.name,
        file: team.submission?.fileURL,
        date: team.submission?.submittedAt,
        score: team.score
    }));

    res.render('contestDetails', { contest, teams: leaderboard, submissions });

});


/* =======================
   CREATE TEAM PAGE
======================= */

contestRouter.get('/contest/:id/create-team', async (req, res) => {

    const contestId = req.params.id;
    const userId = req.session.userId;

    const contest = await Contest.findById(contestId);
    const user = await User.findById(userId);

    if (user.participatedContests.includes(contestId)) {
        return res.status(400).send("You have already joined this contest");
    }

    if (!contest) {
        return res.status(404).send("Contest not found");
    }

    res.render('createTeam', { user, contest });

});


/* =======================
   CREATE TEAM
======================= */

contestRouter.post('/contest/:id/create-team', async (req, res) => {

    const contestId = req.params.id;
    const contest = await Contest.findById(contestId);

    let { teamName, members } = req.body;

    const leaderId = members[0];
    const leader = await User.findById(leaderId);

    leader.participatedContests.push(contestId);
    await leader.save();

    members = members.filter(mem => mem !== "");

    if (!leader) {
        return res.status(400).send("Leader not found");
    }

    const team = await Contest_M.createTeam(teamName, contestId, leader._id);

    for (let i = 1; i < members.length; i++) {

        const member = await User.findOne({ email: members[i] });

        if (!member) {
            return res.status(400).send(`User with email ${members[i]} not found`);
        }

        member.inviteRequests.push({
            user: leader._id,
            contest: contestId,
            team: team._id
        });

        await member.save();
    }

    res.redirect(`/contest/${contestId}`);

});


/* =======================
   VIEW TEAMS TO JOIN
======================= */

contestRouter.get('/contest/:id/teams', async (req, res) => {

    const contestId = req.params.id;

    const contest = await Contest_M.getContest(contestId);

    if (!contest) {
        return res.status(404).send("Contest not found");
    }

    const teams = contest.teams.filter(team =>
        (team.members.length + 1) < contest.maxTeamSize
    );

    res.render('joinTeam', { teams, contest });

});


/* =======================
   SEND JOIN REQUEST
======================= */

contestRouter.post('/contest/:id/teams', async (req, res) => {

    const contestId = req.params.id;
    const { teamId } = req.body;

    const userId = req.session.userId;

    const user = await User.findById(userId);

    const contest = await Contest.findById(contestId).populate('teams');

    const team = contest.teams.id(teamId);

    if (!team) {
        return res.status(404).send("Team not found");
    }

    if (team.members.length + 1 >= contest.maxTeamSize) {
        return res.status(400).send("Team is full");
    }

    try {

        const leaderId = team.leader;

        const leader = await User.findById(leaderId);

        leader.joinRequests.push({
            user: userId,
            contest: contestId,
            team: teamId
        });

        await leader.save();

        user.inviteRequests.push({
            user: leaderId,
            contest: contestId,
            team: teamId
        });

        await user.save();

        res.redirect(`/contest/${contestId}/teams`);

    }
    catch (err) {

        console.error(err);
        res.status(500).send("Error sending join request");

    }

});


/* =======================
   SUBMIT PROJECT
======================= */

contestRouter.post(
'/contest/:id/submit',
upload.single('submissionFile'),
async (req, res) => {

    const contestId = req.params.id;
    const { teamId } = req.body;
    const userId = req.session.userId;

    const submissionFile = req.file;

    const contest = await Contest.findById(contestId);

    const team = contest.teams.id(teamId);

    if (
        team.leader.toString() !== userId &&
        !team.members.some(m => m.toString() === userId)
    ) {
        return res.status(403).send("Not your team");
    }

    const submission = await Submission_M.createSubmission(
        contestId,
        teamId,
        submissionFile.path
    );

    team.submission = submission._id;

    await contest.save();

    res.redirect(`/contest/${contestId}`);

}
);


/* =======================
   SCORE SUBMISSION
======================= */

contestRouter.post('/contest/:id/score/:submissionId', async (req, res) => {

    const { score } = req.body;

    const contestId = req.params.id;
    const submissionId = req.params.submissionId;

    const submission = await Submission.findById(submissionId);

    submission.score = score;

    const teamId = submission.teamId;

    const contest = await Contest.findById(contestId);

    const team = contest.teams.id(teamId);

    team.score = score;

    submission.evaluationStatus = "evaluated";

    await submission.save();
    await contest.save();

    res.redirect(`/contest/${contestId}`);

});


module.exports = {
    contestRouter
};