const { Contest } = require('../utils/db');
const { User } = require('../utils/db');

const createContest = async (
    name,
    description,
    hostId,
    startDate,
    endDate,
    category,
    problemStatement,
    max_team
) => {
    try {
        const newContest = new Contest({
            name,
            description,
            hostedBy: hostId,
            startDate,
            endDate,
            category,
            problemStatement,
            max_team,
        });
        const host = await User.findById(hostId);
        host.hostedContests.push(newContest._id);
        await host.save();
        return await newContest.save();
    }
    catch (err) {
        console.log(err);
        throw new Error("Error creating contest");
    }
};

const getContest = async (contestId) => {
    try {
        return await Contest.findById(contestId).populate("teams.leader","name").populate("teams.members","name").populate("hostedBy");
    }
    catch (err) {
        throw new Error(`Error fetching contest , ${err}`);
    }
};

const getAllContests = async () => {
    try {
        return await Contest.find({});
    }
    catch (err) {
        throw new Error("Error fetching contests");
    }
};

const getTeams = async (contestId) => {
    try {
        const contest = await Contest.findById(contestId);
        if (!contest) throw new Error("Contest not found");
        return contest.teams;
    }
    catch (err) {
        throw new Error("Error fetching teams");
    }
};

const getTeam = async (contestId, teamId) => {
    try {
        const contest = await Contest.findById(contestId);
        if (!contest) throw new Error("Contest not found");
        return contest.teams.id(teamId);
    }
    catch (err) {
        throw new Error("Error fetching team");
    }
};

const createTeam = async (teamName, contestId, leader) => {
    try {
        const contest = await Contest.findById(contestId);
        contest.teams.push({ name: teamName, leader, members: [] });
        await contest.save();
        return contest.teams[contest.teams.length - 1];
    }
    catch (err) {
        throw new Error("Error creating team");
    }
};

const joinTeam = async (contestId, teamId, userId) => {
    try {
        const contest = await Contest.findById(contestId);
        const team = contest.teams.id(teamId);
        if (!team) throw new Error("Team not found");
        team.members.push(userId);
        await contest.save();
        return team;
    }
    catch (err) {
        throw new Error("Error joining team");
    }
};

const attachSubmission = async (contestId, teamId, submissionId) => {
    try {
        const contest = await Contest.findById(contestId);
        const team = contest.teams.id(teamId);
        if (!team) throw new Error("Team not found");
        team.submission = submissionId;
        await contest.save();
        return team;
    }
    catch (err) {
        throw new Error("Error attaching submission");
    }
};

const evaluateSubmission = async (contestId, teamId, score) => {
    try {
        const contest = await Contest.findById(contestId);
        const team = contest.teams.id(teamId);
        if (!team) throw new Error("Team not found");
        team.score = score;
        await contest.save();
        return team;
    }
    catch (err) {
        throw new Error("Error evaluating submission");
    }
};

const getLeaderboard = async (contestId) => {
    try {
        const contest = await Contest.findById(contestId);
        const teams = contest.teams.sort((a, b) => b.score - a.score);
        return teams;
    }
    catch (err) {
        throw new Error("Error fetching leaderboard");
    }
};

const deleteContest = async (contestId) => {
    try {
        return await Contest.findByIdAndDelete(contestId);
    }
    catch (err) {
        throw new Error("Error deleting contest");
    }
};

const updateStatus= async()=>{
    try{
      const contests= await Contest.find({});
        const now= new Date();
        for(let contest of contests){
            if (now < contest.startDate){
                contest.status="upcoming";
            }
            else if(contest.startDate<=now && contest.endDate>=now){
                contest.status="active";
            }
            else{
                contest.status="ended";
                updateRewards(contest);
            }
            await contest.save();
        }
        return contests;
    }
    catch{
        throw new Error("Error updating the status");
    }
    
}

const updateRewards = async (contest) => {
    if (contest.rewardsDistributed) return;
    const teams = await getLeaderboard(contest._id);
    if (!teams || teams.length === 0) return;
    const rewards = [100, 80, 60];
    for (let i = 0; i < Math.min(3, teams.length); i++) {
        const team = teams[i];
        if (!team) continue; 
        const points = rewards[i];
        const leaderId=team.leader;
        const leader=await User.findById(leaderId);
        leader.points+=rewards[i];
        await leader.save();
        const members=team.members;
        for(let member of members){
            const mem=await User.findById(member);
            mem.points+=rewards[i];
            await mem.save();
        }

    }

    contest.rewardsDistributed = true;
    await contest.save();
};



module.exports = {
    createContest,
    getContest,
    getAllContests,
    getTeams,
    getTeam,
    createTeam,
    joinTeam,
    attachSubmission,
    evaluateSubmission,
    getLeaderboard,
    deleteContest,
    updateStatus
};