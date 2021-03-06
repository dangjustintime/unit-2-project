// DOTO: need to fix job finished route to update balance on home page
// dependencies
const express = require("express");
const router = express.Router();
const Job = require("../models/job.js"); 
const User = require("../models/user.js");

// routes
// index route
router.get("/", (request, response) => {
    Job.find({}, (error, allJobs) => {
        response.render("jobs.ejs", {
            currentUser: request.session.currentUser,
            Jobs: allJobs
        });
    });
});

// new route
router.get("/new", (request, response) => {
    response.render("newJob.ejs", {
        currentUser: request.session.currentUser
    });
});
router.post("/", (request, response) => {
    request.body.skillsRequired = request.body.skillsRequired.split(",");
    request.body.finished = false;
    request.body.helper = "";
    request.body.author = request.session.currentUser.name;
    Job.create(request.body, (error, newJob) => {
        response.redirect("/job");
    });
    // push job title to author's jobAsked array
    User.findByIdAndUpdate(request.session.currentUser._id, { $push: { jobsAsked: request.body.title } }, 
        (error, updatedUser) => {
            if (error) {
                console.log(error);
            } else {
                console.log(updatedUser);
            }
    });
});

// show route
router.get("/:id", (request, response) => {
    Job.findById(request.params.id, (error, currentJob) => {
        response.render("jobDetails.ejs", {
            currentUser: request.session.currentUser,
            Job: currentJob
        });
    });
});

// edit route
router.get("/:id/edit", (request, response) => {
    Job.findById(request.params.id, (error, currentJob) => {
        response.render("editJob.ejs", {
            currentUser: request.session.currentUser,
            Job: currentJob
        });
    });
});
router.put("/:id", (request, response) => {
    request.body.skillsRequired = request.body.skillsRequired.split(",");
    if (request.body.finished == "on") {
        request.body.finished = true;
    } else {
        request.body.finished = false;
    }
    Job.findByIdAndUpdate(request.params.id, request.body,
        { new: true }, (error, UpdatedJob) => {
           response.redirect("/job/" + request.params.id);     
    });
});

// take job route
router.put("/:id/helpOut", (request, response) => {
    Job.findByIdAndUpdate(request.params.id, { helper: request.session.currentUser.name }, (error, UpdatedJob) => {
        response.redirect("/");
    });
});

// job finished route
router.put("/:id/finished", (request, response) => {
    Job.findByIdAndUpdate(request.params.id, { finished: true }, { new: true },
     (error, updatedJob) => {
        if (error) {
            console.log(error);
        } else {
            console.log(updatedJob);
            User.findOneAndUpdate({ name: updatedJob.author },
                { $inc: { balance: -updatedJob.price } }, { new: true },
                    (error, updatedAuthor) => {
                    console.log(updatedAuthor);
            });
            User.findOneAndUpdate({ name: updatedJob.helper },
                { $inc: { balance: +updatedJob.price } }, { new: true },
                    (error, updatedHelper) => {
                    console.log(updatedHelper);
            });
            request.session.currentUser.balance -= updatedJob.price;
            response.redirect("/");
        }
     });
});

// delete route
router.delete("/:id", (request, response) => {
    Job.findByIdAndDelete(request.params.id, (error, currentProduct) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Deleting Job...");
        }
    });
    response.redirect("/");
});

module.exports = router;
