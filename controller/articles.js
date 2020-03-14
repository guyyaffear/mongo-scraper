var express = require("express");
var router = express.Router();
var path = require("path");
var request = require("request");
var cheerio = require("cheerio");
var Article = require("../models/Article.js");

router.get("/api/articles", function(req, res) {
    Article.find()
      .sort({ _id: -1 })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          var artcl = { article: doc };
          console.log(doc[0].title);
          console.log(doc[0]._id);
          // console.log('ARTICLES', artcl);
          
          res.render("index", artcl);
        }
      });
  });
  
  router.get("/api/articles-json", function(req, res) {
    Article.find({}, function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        res.json(doc);
      }
    });
  });
  
  router.get("/api/clearAll", function(req, res) {
    Article.remove({}, function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        console.log("removed all articles");
      }
    });
    res.redirect("/articles-json");
  });
  
  router.get("/api/readArticle/:id", function(req, res) {
    var articleId = req.params.id;
    var hbsObj = {
      article: [],
      body: []
    };
  console.log('GETTING ARTICLE')
    Article.findOne({ _id: articleId })
      .populate("comment")
      .exec(function(err, doc) {
        if (err) {
          console.log("Error: " + err);
        } else {
          console.log('FOUND ARTICLE', doc)
          hbsObj.article = doc;
          var link = 'https:' + doc.link;
          console.log('link is', link)
          request(link, function(error, response, html) {
            console.log('got HTML', html)
            var $ = cheerio.load(html);
  
            $("p.speakable").each(function(i, element) {
              console.log('inside p', i)
              hbsObj.body = hbsObj.body + $(element).text();
            });
  
            console.log('hbsObj', hbsObj)
            res.render("article", hbsObj);
              return false;
          });
        }
      });
  });