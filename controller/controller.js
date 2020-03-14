// read: /api/articles
// create: /api/articles
// delete: /api/articles
// delete: /api/articles/:id



var express = require("express");
var router = express.Router();
var path = require("path");
var request = require("request");
var cheerio = require("cheerio");
var Comment = require("../models/Comment.js");
var Article = require("../models/Article.js");

router.get("/", function(req, res) {
  res.redirect("/api/articles");
});

router.get("/api/scrape", function(req, res) {
  request("https://www.foxnews.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    var titlesArray = [];

    $(".info-header").each(function(i, element) {
      var result = {};

      result.title = $(this)
      .children("h2")
        .children("a")
        .text();
      result.link = $(this)
      .children("h2")
        .children("a")
        .attr("href");

      if (result.title !== "" && result.link !== "") {
        if (titlesArray.indexOf(result.title) == -1) {
          titlesArray.push(result.title);

          Article.count({ title: result.title }, function(err, test) {
            if (test === 0) {
              var entry = new Article(result);

              entry.save(function(err, doc) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(doc);
                }
              });
            }
          });
        } else {
          console.log("Article already exists.");
        }
      } else {
        console.log("Not saved to DB, missing data");
      }
    });
    res.redirect("/");
  });
});
router.get("/api/articles", function(req, res) {
  Article.find()
    .sort({ _id: -1 })
    .exec(function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        var artcl = { article: doc };
        // console.log(doc[0].title);
        // console.log(doc[0]._id);
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
  console.log("i am here in this API");
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
router.post("/api/comment/:id", function(req, res) {
  var user = req.body.name;
  var content = req.body.comment;
  var articleId = req.params.id;

  var commentObj = {
    name: user,
    body: content
  };

  var newComment = new Comment(commentObj);

  newComment.save(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log(doc._id);
      console.log(articleId);

      Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { comment: doc._id } },
        { new: true }
      ).exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/api/readArticle/" + articleId);
        }
      });
    }
  });
});

module.exports = router;
