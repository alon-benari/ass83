"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');
// project 7 additions.

var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
const upload = multer({
    dest: 'images/' });// this saves your file into a directory called "uploads
var fs = require("fs");

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

// XXX - Your submission should work without this line
// var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
//
// project 7 add on
//
app.use(session({secret: 'secretKeys', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}))
//
// ///////////////begin:for file upload



/////////end for file upload

app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
    
// var url  = 'mongodb://localhost/cs142project6'
// mongoose.connect(url)
app.get('/user/list', function (request, response) {
    if (request.session.user === "undefined"){
        console.log(request.session.user);
     return;
    }
 
    User.find({},function(err,users) {
        if (!err) {
            var usersStack =[];
            var usrs = JSON.parse(JSON.stringify(users));
            usrs.forEach(function(el){
                delete el.__v;
                delete el.location;
                delete el.description;
                delete el.occupation;
                usersStack.push(el);
                const userFirst = usersStack.filter(Obj => Obj._id ==request.session.user_id)
                const theRest = usersStack.filter(Obj =>Obj._id !==request.session.user_id)
                console.log('userFirst:',userFirst)
                usersStack = userFirst.concat(theRest)
                console.log('usersStack:',usersStack)
                // console.log(usersStack);
            });
            
            response.status(200).send(usersStack);
        }else {
            console.log('we have a problem: ',err);
        }
    });
});

app.post('/user', function(req,res){
  
    console.log('req,',req.body);
    var payload = {
        'first_name':req.body.first_name,
        'last_name':req.body.last_name,
        'password':req.body.password0,
        'login_name':req.body.login_name,
        'location':req.body.location,
        'description':req.body.description,
        'occupation':req.body.occupation
    };
    console.log('payload:',payload);
    User.findOne({login_name:req.body.login_name},'login_name', function(err,oneUser){
        if (!err){ console.log('oneUser1:',oneUser);
            if (oneUser !== null){
                console.log('oneUser:',oneUser);
                console.log('user is already taken, try another login name');
                res.status(400).send({err:'user is already taken, try another login name'});
            } else {
                console.log('oneUser: ',oneUser);
                console.log('go ahead and register');
                var aNewUser = new User(req.body);
                aNewUser.save(function(err){
                    if (err){
                        res.status(500).send({err:'failed to create use un db'});
                    } else {
                        res.status(200).send({err:' successful registration'});
                    }
                });
                //  res.status(200).send({err:' successful'})
            }
            
        } else {
            console.log(' whoops, db error could not find that login name ');
            res.status(500).send({err:' whoops, db error could not find that login name '});
        }
    });
});

app.post('/admin/login',function(req,res){
  
    var payload = {
         login:req.body.login,
         pswd: req.body.pswd
    };
    console.log(payload);
    User.findOne({login_name:payload.login},{},function(err,person){
        if (!err ) {//&& person.length !==0
            if (person.login_name ===req.body.login ){//
                if ( person.password === req.body.pswd){//
                     console.log('we got a match pswd and user name');
                req.session.user = person.first_name; // store user in the session.//
                req.session.user_id = person._id // keep the id
                req.session.first_name = person.first_name; // keep first  name
                req.session.last_name = person.last_name    // keep last name
                console.log('successful login:',req.session.user)
                console.log(person._id);//
                // update login time:
                var st = new Date()
                var vt = Date(st.setHours(st.getHours()+7))
                person.login_date_time = String(vt.valueOf())
                person.save(function(err){//
                    if (err){
                        console.log(err)
                        res.status(500).send(err)
                    } else {
                        console.log('updated login time correctly, updating ')

                    }
                })
                res.status(200).send(person);//
                } else {
                    console.log('wrong password try again');
                    res.status(404).send({err:'Wrong password, try again'});
                }
            } else {
                console.log('not in database: need to register');
                 res.status(404).send({err:'User Not Found  '});
            }
        } 
        else {
            console.log('Not in database, need to register');
            res.status(404).send({err:'User was not found consider registering'});
        }
    });
});

app.post('/admin/logout', function(req,res){
    if (typeof req.session.user === null){
        return;
    }
    console.log(req.session.user);
    console.log({user:req.session.user,"user_id":req.session.user_id})
    // updating logout time for the user.
    User.findOne({_id:req.session.user_id},function(err,userInfo){
        if (!err ){
            // var st = new Date().valueOf()
            var st = new Date()
            var vt = Date(st.setHours(st.getHours()+7))
            userInfo.logout_date_time = String(vt.valueOf())
            userInfo.save()
        } else {

        }
    })  
    console.log('killing session');
    req.session.destroy();
    res.status(200).send('Please Login');
            
       
});


/* 
* URL /singlephoto/:photo_id version 2
*/
app.get('/singlephoto/:photo_id',function(req,res){
    console.log('inside singlephoto')
    console.log(req.params.photo_id)
    Photo.find({_id:req.params.photo_id} ,{}, function(err, photoMetaData){
        if (!err && photoMetaData.length>0 ){
            //figure out if favrd_by
            console.log('****favrdBy******',photoMetaData[0].favrd_by)
            var userAlreadyfavrdImage = photoMetaData[0].favrd_by
            const doesUserAlreadyFavrd = userAlreadyfavrdImage.filter(Obj => Obj.user_id == req.session.user_id)
            if (doesUserAlreadyFavrd.length == 0){
                var disable = false
            } else {
                var  disable = true
            }
            // 
            var metaData = JSON.parse(JSON.stringify(photoMetaData));
            delete metaData.__v;
            var updatedPhotoData =[];
            async.each(metaData,function(item,cb1){
                var commentStack=[];
              async.each(item.comments,function(c,cb2){
                //   console.log(c.user_id);
                  User.findOne({_id:c.user_id},'_id first_name last_name',function(err,fullName){
                    if(err) {
                        console.log(err);
                    }else{
                        console.log('before: ',JSON.parse(JSON.stringify(fullName)));
                        //var firstLast = JSON.parse(JSON.stringify(fullName));
                        var user = JSON.parse(JSON.stringify(fullName));
                        console.log('new user: ',user);
                        // console.log('firstLast:',typeof(firstLast));
                        // delete firstLast.__v;
                        var newComment = JSON.parse(JSON.stringify(c));
                        //
                        console.log('USER',user)
                        newComment.user = user;
                        delete newComment.user_id;
                        commentStack.push(newComment);
                        cb2();
                    }
                  });
              },function(er){
                  if(er) {console.log(er);}
                //   console.log('commentStack: ',commentStack);
                  var newItem = JSON.parse(JSON.stringify(item));
                  newItem.comments = commentStack;
                  delete newItem.__v;
                //   console.log('item: ',newItem);
                  updatedPhotoData.push(newItem);
                //   console.log('innerAsync');
                  cb1();
              });
            }, function(err){
                if (err) {
                    console.log(err);
                } else{
                    // console.log(updatedPhotoData);
                    res.status(200).send({photoData:updatedPhotoData,disable:disable});
                    console.log(updatedPhotoData.length);
                    console.log('AllDone, almost there');
                }
                
            });
       
        }
        else{
            response.status(400).send({err:err});
        }
    });
})


/*
* URL /singlephoto/:photo_id  version 1
*/
// app.get('/singlephoto/:photo_id', function(req,res){
//     console.log('inside singlephoto')
//     console.log(req.params.photo_id)
//     User.findOne({_id:req.session.user_id},function(err,userDetails){
//         if (!err){
//             var comntUserInfo = {
//                 _id:userDetails._id,
//                 first_name:userDetails.first_name,
//                 last_name:userDetails.last_name
//             }
// Photo.findOne({_id:req.params.photo_id},function(err,singlePhotoData){
//     if (!err){
//         console.log('****favrdBy******',singlePhotoData.favrd_by)
//         var userAlreadyfavrdImage = singlePhotoData.favrd_by
//         const doesUserAlreadyFavrd = userAlreadyfavrdImage.filter(Obj => Obj.user_id == req.session.user_id)
//         if (doesUserAlreadyFavrd.length == 0){
//                var disable = false
//         } else {
//             var  disable = true
//         }
//         console.log('******contUserInfo******',comntUserInfo)
//         console.log('****singlePhotoData*****',singlePhotoData)
//                     // Fix comment problem here
                   
//         res.status(200).send({photoInfo:singlePhotoData,disable:disable})
//         } else {
//             res.status(404).send({err:err})
//          }
//         })          


//         //    console.log('******contUserInfo******',comntUserInfo)
//         } else {
//             console.log('cannot read table User');
//             return;
//         }
//     })
//     // Photo.findOne({_id:req.params.photo_id},function(err,singlePhotoData){
//     //     if (!err){
//     //         console.log('****favrdBy******',singlePhotoData.favrd_by)
//     //         var userAlreadyfavrdImage = singlePhotoData.favrd_by
//     //         const doesUserAlreadyFavrd = userAlreadyfavrdImage.filter(Obj => Obj.user_id == req.session.user_id)
//     //         if (doesUserAlreadyFavrd.length == 0){
//     //             var disable = false
//     //         } else {
//     //            var  disable = true
//     //         }
//     //         console.log('******contUserInfo******',comntUserInfo)
//     //         console.log('****singlePhotoData*****',singlePhotoData)
//     //         // Fix comment problem here
           
//     //         res.status(200).send({photoInfo:singlePhotoData,disable:disable})
//     //     } else {
//     //         res.status(404).send({err:err})
//     //     }
//     // })
//     // codeto return photo with id photo_id

// });


/*
 * URL /user/:id - Return the information for User (id)
 */

app.get('/user/:id', function (request, response) {
   
    if (request.session === undefined){
        console.log('from server','its dead');
        response.redirect("components/login-register/login-registerTemplate.html");
            return;
    } 
    var id = request.params.id;

    User.find( {_id:id}, {} ,function(err,user) {
        if (!err) {
             if (user[0] === null) {
                 console.log('User with _id:' + id + ' not found.');
                 response.status(400).send('Not found');
                 return;
             } else {
                
                var userById = JSON.parse(JSON.stringify(user[0]));
                delete userById.__v;
                delete userById._id;
                delete userById.password;
                delete userById.recent_comment_date_time;
                delete userById.posted_photo_date_time;
                delete userById.registered_date_time;
                delete userById.login_date_time;
                delete userById.logout_date_time;
                delete userById.favorites;
                // console.log('userById:',id)
                // find the most recent photo for that use with use id 
                Photo.find({user_id:id}).sort({date_time:-1}).limit(1).exec((err,datePhotos)=>
                    {
                        if (! err ) { 
                            
                            Photo.find({user_id:id},function(err,commentsCount) {
                                console.log('commentsCount:',commentsCount)
                                var lengthArray = []
                                commentsCount.forEach(function(el){
                                    
                                    lengthArray.push(el.comments.length)
                                    
                                })
                                console.log('lengthArray:',lengthArray)
                                var maximalCommentNum = lengthArray.indexOf(Math.max.apply(null,lengthArray))
                                console.log('most commented  is: ',commentsCount[maximalCommentNum])
                                var usersModel = {userById:userById,
                                    recentPhoto:datePhotos[0],
                                    mostCommmentedPhoto:commentsCount[maximalCommentNum]}
                                    console.log('usersModel:',usersModel)
                                    response.status(200).send(usersModel);
                                
                            })
                                // var usersModel = {userById:userById,
                                //                 recentPhoto:datePhotos[0]}
                                //                 console.log(usersModel)
                                // response.status(200).send(usersModel);
                        } else {
                            console.log('no photos were found')
                            
                        }
                })
                  }
        }else {
            response.status(400).send(err);
        }
    });
    // var user = cs142models.userModel(id);
   
    });
    

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */


app.get('/photosOfUser/:id', function (request, response) {
    
    if (typeof request.session.user === 'undefined'){
        return;
    }
    var id = request.params.id;  
    Photo.find({user_id:id} ,{}, function(err, photoMetaData){
        if (!err && photoMetaData.length>0 ){
            var metaData = JSON.parse(JSON.stringify(photoMetaData));
            delete metaData.__v;
            var updatedPhotoData =[];
            async.each(metaData,function(item,cb1){
                var commentStack=[];
              async.each(item.comments,function(c,cb2){
                //   console.log(c.user_id);
                  User.findOne({_id:c.user_id},'first_name last_name',function(err,fullName){
                    if(err) {
                        console.log(err);
                    }else{
                        console.log('before: ',JSON.parse(JSON.stringify(fullName)));
                        //var firstLast = JSON.parse(JSON.stringify(fullName));
                        var user = JSON.parse(JSON.stringify(fullName));
                        console.log('new user: ',user);
                        console.log('firstLast:',typeof(firstLast));
                        // delete firstLast.__v;
                        var newComment = JSON.parse(JSON.stringify(c));
                        //
                        // var user ={_id:firstLast._id,first_name:firstLast.first_name,last_name:firstLast.last_name};
                        //
                        newComment.user = user;
                        delete newComment.user_id;
                        commentStack.push(newComment);
                        cb2();
                    }
                  });
              },function(er){
                  if(er) {console.log(er);}
                //   console.log('commentStack: ',commentStack);
                  var newItem = JSON.parse(JSON.stringify(item));
                  newItem.comments = commentStack;
                  delete newItem.__v;
                //   console.log('item: ',newItem);
                  updatedPhotoData.push(newItem);
                //   console.log('innerAsync');
                  cb1();
              });
            }, function(err){
                if (err) {
                    console.log(err);
                } else{
                    // console.log(updatedPhotoData);
                    response.status(200).send({photoData:updatedPhotoData,logged_id:request.session.user_id});
                    console.log(updatedPhotoData.length);
                    console.log('AllDone, almost there');
                }
                
            });
       
        }
        else{
            response.status(400).send({err:err});
        }
    });

   
    
});

app.get('/alreadyFav',function(req,res){
    if (req.session.user_id === 'undefined') {
        return;
    }
    console.log('check if already Fav')
    console.log('the userid is:',req.session.user_id)
    
    User.findOne({_id:req.session.user_id},'favorites',function(err,userFavList){
        if(!err){
            console.log(userFavList)
        }
    })
    

})



app.post('/addtofavs/:photo_id',function(req,res) {
    if (req.session.user === 'undefined') {
        return;
    }
    console.log('photo_id',req.params.photo_id)
    console.log('user is',req.session.user)
    console.log('_id:',req.session.user_id)
    // check that one can add the photo to the user list of favorties:
    // User.findOne({_id:req.session.user_id},function(err,userFavList){
    //     if(!err){
    //         var favPhotos = [];
    //         console.log('favList',userFavList.favorites)
              
                
    //     }
    // })
    // add list of favorites in Photos
    Photo.findOne({_id:req.params.photo_id},function(err,add2Favs){
        if(!err) {
            var fav_usr = {
                user_id:req.session.user_id,
                user:req.session.user,
                disable:true,
                file_name:add2Favs.file_name
            }
            // making sure we are not adding an existing user 
            add2Favs.favrd_by.forEach(function(el){

            })
            var tempFavUserList = add2Favs.favrd_by
            tempFavUserList.push(fav_usr)
            add2Favs.favrd_by = tempFavUserList
            add2Favs.save(function(err){
                if (!err){
                     // add to list of favorite of user that made the photo favorite.
                    User.findOne({_id:req.session.user_id},function(err,add2UserFavList){
                if (!err){
                    var userFavListData = {
                        file_name:add2Favs.file_name,
                        photo_id:req.params.photo_id
                       
                    }
                    console.log('userFavListData:',userFavListData)
                    var tempUserFavList  = add2UserFavList.favorites
                    tempUserFavList.push(userFavListData)
                    add2UserFavList.favorites = tempUserFavList
                    console.log('*',tempUserFavList)
                    add2UserFavList.save() // update the record
                    res.status(200).send(add2Favs)
                }

                
            })    
                }
            })
        } 

    })

})

app.post('/commentsOfPhoto2/:photo_id',function(req,res){
    if (req.session.user_id === 'undefined') {
        return;
    }
    console.log('in the api');
    var photo_id = req.params.photo_id;
    console.log(req.params.photo_id);
    console.log('req.body: ',req.body.newComnt);
   
    Photo.findOne({_id:req.params.photo_id},function(err,aPhoto){
        if(!err){
            var newComment = {
                comment:req.body.newComnt,
                user_id:req.session.user_id,
                date_time:Date()
            }
            // console.log('###newComment###',newComment)
            var commentsArray = aPhoto.comments;
            commentsArray.push(newComment)
            console.log('commentsArray:',commentsArray)
            aPhoto.comments = commentsArray
             aPhoto.save(function(err){
                 if (err) {
                     console.log('err in updating');
                    //  res.status(500).send(err);
                 } else { // add a time stamp to User
                     User.findOne({_id:req.session.user_id},function(err,commentDateTime){
                         if (!err){
                            var st = new Date()
                            var vt = Date(st.setHours(st.getHours()+7))
                             commentDateTime.recent_comment_date_time = String(vt.valueOf())
                             commentDateTime.save()
                             res.status(200).status('comment added and time stamped')
                             //
                         }else {
                             res.status(500).send(err)
                         }
                     })

                 }
             });
        } else {
            res.status(400).send(err);
        }
    });

})


app.post('/commentsOfPhoto/:photo_id', function(req, res){
    if (req.session.user_id === 'undefined') {
        return;
    }
    console.log('in the api');
    var photo_id = req.params.photo_id;
    console.log(req.params.photo_id);
    console.log('req.body: ',req.body.comments);
    // 
    
    Photo.findOne({_id:req.params.photo_id},function(err,aPhoto){
        if(!err){
            console.log('original: ',aPhoto);
            aPhoto.comments = req.body.comments;
            console.log('The new ....',aPhoto);
             aPhoto.save(function(err){
                 if (err) {
                     console.log('err in updating');
                     res.status(500).send(err);
                 } else { // add a time stamp to User
                     User.findOne({_id:req.session.user_id},function(err,commentDateTime){
                         if (!err){
                            var st = new Date()
                            var vt = Date(st.setHours(st.getHours()+7))
                             commentDateTime.recent_comment_date_time = String(vt.valueOf())
                             commentDateTime.save()
                             //
                         }
                     })

                 }
             });
        } else {
            res.send(err);
        }
    });
});
///////////////////// for file uploading //////////////////////
// app.post('/photos/new', function(req,res){
//     console.log('inside photos new')
//     console.log(Object.keys(req))

// })
    

// app.post('/photos/new', upload.single('recfile'), function(req, res) {
//      console.log(req.file);
//     if (req.file === undefined){
//         res.statusStatus(400).send({err:'no file was selected'});
//     }
//     //  if (req.session.use === undefined) {
//     //      res.send(400).redirect('back')
         
//     //  }
//      User.findOne({first_name:req.session.user},'_id',function(err,d){
//     //  })
//          if(!err) { 
//              console.log('_id',d);
//              var photoDoc = {
//                  'user_id':d,
//                  'file_name':req.file.filename,
//                  'date_time':Date(),
//                  'comments':[]};
//                  console.log(photoDoc);
//                  var newPhoto = new Photo(photoDoc);
//                  newPhoto.save(function(err){
//                      if (!err){
//                          console.log('added a photo');
//                          console.log(photoDoc);
                         
//                          Photo.find({"user_id":photoDoc.user_id},function(err,veri){
//                                 if(!err){
//                                     console.log('veri:',veri)
//                                     return res.status(200).send('photo uploaded')
//                                 } else {
//                                     console.log('could not find')
//                                 }
                                
//                          })
//                      } else {
//                          return res.status(500).send({err:err});
//                      }
//                  });
//                   } else {
//                     res.status(404).send({err:err});
            
//          }
      
//     });
   
// });
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

app.post('/photos/new', function(req,res){
    console.log('inside /photos/new end point ')
    console.log('body:', req.body)
    console.log('file:', req.body.file)
    console.log('req.user:',req.session.user)


    // res.status(500).send(JSON.stringify())
    processFormBody(req, res, function (err) {
        console.log('err: ',err)
        if (err ) {
            console.log(err)
            res.status(500).send(JSON.stringify(err))
            return;
        }
    
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes
    
        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        // var timestamp = new Date().valueOf();
        // var filename = 'U' +  String(timestamp) + request.file.originalname;
    
        // fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
        //   // XXX - Once you have the file written into your images directory under the name
        //   // filename you can create the Photo object in the database
        // });
    });
  
})  
    //  User.findOne({login_name:req.session.user}),function(err,data){
    //      if (!err){
    //          console.log("data: ",data)
    //      } else {
    //          console.log({err:err})
    //          res.send({err:err})
    //      }
         
    //  }
   
 
  
/////////////////////////////end file upload
app.get('/photos/:user_id/', function(req,res){
    if (req.session.user === undefined){
        return;
    }
    var id = req.params.id;
    // var photoId = req.params.photoId
    console.log(req.params);
    Photo.find({user_id:id},{},function(err,userPhotos){
        if (!err ){
          
                console.log(userPhotos);
                res.status(200).send('userPhotos');
          
                

            } else {
                console.log('no photos');
            }
            
      
            console.log('error in opening the database');
        });
       
    });

app.get('/getFavs/', function(req,res){
    console.log('logged in:',req.session.user)
    console.log('userid:',req.session.user_id)
    User.findOne({_id:req.session.user_id},function(err,favs){
        if(!err){
            console.log(favs)
            res.status(200).send(favs.favorites)

        }
    })
})



app.post('/removeFav/:photo_id',function(req,res){
    console.log('inside removeFav')
    console.log('photo_id:',req.params.photo_id)
    var photo_id = req.params.photo_id
    User.findOne({_id:req.session.user_id},function(err,fl){
        var userFlist = JSON.parse(JSON.stringify(fl.favorites))
        // console.log('userFlist',userFlist)
        const newFavList = userFlist.filter(obj=>obj.photo_id!==photo_id)
        console.log('The new:',newFavList)
        fl.favorites = newFavList
        //res.status(200).send({res:newFavList})
        fl.save(function(err){
            if(err){
                console.log(err)
            } else {
                Photo.findOne({_id:req.params.photo_id},{},function(err,getFavrdBy){
                    // console.log('getFavrdBy',getFavrdBy.favrd_by)
                    var photoFavrdBy = getFavrdBy.favrd_by
                    const newFavrdByList = photoFavrdBy.filter(obj => obj.user_id != req.session.user_id) 
                    // console.log('new Favrd by list',newFavrdByList)
                    getFavrdBy.favrd_by = newFavrdByList
                    getFavrdBy.save()
                    res.status(200).send({res:newFavList})
                })

            }
        })

    
    }) 


app.post('/getCommentDateTime',function(res,req){
    console.log('************ inside getCommentDateTime***********')
    User.findOne({_id:req.session.id},{},function(err,commentDateTime){
        if (!err) {
             var dateTime = new Date();
             commentDateTime.recent_comment_date_time = dateTime;
             console.log('++++++++++++++++++commentDateTime++++++++++++++++++',commentDateTime);
             res.status(200).send(commentDateTime)
        } else {
            res.status(400).send(err)
        }
      
    })

})



})
var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


