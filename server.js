//jshint esversion:6

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');

var day = new Date();
var options = {
  weekday: "long",
  day: "numeric",
  month: "long"
};
//var today = day.toLocaleDateString("en-US", options);
var today="Today";
//Database area
mongoose.connect("mongodb://localhost:27017/todoListDb", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const listSchema = new mongoose.Schema({
  topic: String
});
const customSchema = new mongoose.Schema({
  name: String,
  itemInList: [listSchema]
});
const listModel = mongoose.model("listcollection", listSchema);
const customModel = mongoose.model("customList", customSchema);
const item1 = new listModel({
  topic: "Welcome to my Todo List"
});
const item2 = new listModel({
  topic: "Hit '+' to add new items"
});
const item3 = new listModel({
  topic: "Hit checkbox to remove the item"
});

listModel.find(function(err, founditems) {
  if (founditems.length == 0) {
    listModel.insertMany([item1, item2, item3]);
  }
});

app.get("/", function(req, res) {
  listModel.find(function(err, founditems) {
    res.render(__dirname + "/views/index.ejs", {
      mylist: founditems,
      titleName: today
    });
  });
});

app.get("/:address", function(req, res) {
  const customName = _.capitalize(req.params.address);
  customModel.findOne({
    name: customName
  }, function(err, found) {
    if (!found) {
      const newList = new customModel({
        name: customName,
        itemInList: [item1, item2, item3]
      });
      newList.save();
      res.redirect("/" + customName);
    } else {
      res.render(__dirname + "/views/index.ejs", {
        mylist: found.itemInList,
        titleName: customName
      });
    }
  });
});

app.post("/add", function(req, res) {
  const listName= req.body.button;
  const data=req.body.newitem;
  const newList = new listModel({
    topic: req.body.newitem
  });
  if(listName===today){
    newList.save();
    res.redirect("/");
  } else{
    customModel.findOne({name:listName},function(err,found){
      if(!err){
        found.itemInList.push(newList);
        found.save();
      }
    });
    res.redirect("/"+listName);
  }

});

app.post("/delete", function(req, res) {
  const titleName=req.body.listname;
  const idName = req.body.input;
  if(titleName===today){
    listModel.findByIdAndRemove(idName, {
      useFindAndModify: true
    }, function() {});
    res.redirect("/");
  }else{
  customModel.findOneAndUpdate({name:titleName},{$pull:{itemInList:{_id:idName}}},{useFindAndModify:true},function(err,found){
    res.redirect("/"+titleName);
  });
}
});


app.listen(3000, function() {
  console.log("Starting the Server at Port 3000");
});
