"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');

var favoriteSchema = new mongoose.Schema({
    file_name:String,
    photo_id:String,
    _id:mongoose.Schema.Types.ObjectId

})
// create a schema
var userSchema = new mongoose.Schema({
    first_name: String, // First name of the user.
    last_name: String,  // Last name of the user.
    login_name:String,   // login name used to login into the application (Add for project 7)
    location: String,    // Location  of the user.
    description: String,  // A brief user description
    occupation: String,    // Occupation of the user.
    password: String, // password for user to be (Add to prohect 7)
    login_date_time: {type: Date, default: null},
    logout_date_time: {type: Date, default:null},
    registered_date_time: {type: Date, default: Date.now},
    posted_photo_date_time: {type:Date, default:null},
    recent_comment_date_time:{type:Date, default: null},
    favorites:[favoriteSchema]
    
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
