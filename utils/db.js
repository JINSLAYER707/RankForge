const mongoose = require('mongoose');


// TEAM SCHEMA (embedded inside contest)

const joinRequestSchema= new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    contest: {
       type:  mongoose.Schema.Types.ObjectId,
       ref: "Contest",
         required:true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required:true
    }
});

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    leader:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },

    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ],

    submission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
        default: null
    },

    score: {
        type: Number,
        default: 0
    },

    rank: {
        type: Number,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});


// CONTEST SCHEMA

const contestSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    hostedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    problemStatement: {
        type: String
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["upcoming", "active", "ended"],
        default: "upcoming"
    },

    maxTeamSize: {
        type: Number,
        default: 3
    },

    rankingRules: [
        {
            rank: Number,
            points: Number
        }
    ],
    category: {
        type: String,

    },

    teams: [teamSchema],

    createdAt: {
        type: Date,
        default: Date.now
    },
    rewardsDistributed: {
        type:Boolean,
        default: false
    }

});


// SUBMISSION SCHEMA

const submissionSchema = new mongoose.Schema({

    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest",
        required: true
    },

    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    fileURL: {
        type: String,
        required: true
    },

    evaluationStatus: {
        type: String,
        enum: ["pending", "evaluated"],
        default: "pending"
    },

    score: {
        type: Number,
        default: null
    },

    feedback: {
        type: String
    },

    submittedAt: {
        type: Date,
        default: Date.now
    }

});


// USER SCHEMA

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    points: {
        type: Number,
        default: 0
    },

    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    incomingRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    hostedContests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contest"
        }
    ],

    participatedContests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contest"
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now
    },
    outgoingRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    joinRequests: [joinRequestSchema],

    inviteRequests: [joinRequestSchema]
});


// EXPORT MODELS

module.exports = {

    User: mongoose.model("User", userSchema),

    Contest: mongoose.model("Contest", contestSchema),

    Submission: mongoose.model("Submission", submissionSchema)

};