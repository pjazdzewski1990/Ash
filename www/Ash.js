
var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec');
  
var Ash = {
  _storedErrorCallback: window.onerror,

  assert: function(element) {
    if(!element){
      //TODO: rethink exception internals, so they allow easy processing 
      throw {
        level:  "Error",
        code: 2,
        message: "Element not found!",
        toString: function(){return JSON.stringify(this);}
      }
    }
  },
  
  _hidden: function(element) {
//    var outOfScreen = function(){
//      var height = element.clientHeight;
//      var width = element.clientWidth;
//      var vertical = element.offsetTop + height < 0 || 
//        element.offsetTop > document.body.offsetHeight;
//      var horizontal = element.offsetLeft + width < 0 || 
//        element.offsetLeft > document.body.offsetWidth;
//      return vertical || horizontal
//    };
//
    var displayNone = element.style && element.style.display === "none";
//    var noVisibility = ["hidden", "collapse"].indexOf(element.style.visibility)>-1;
//    console.log("_hidden: " + displayNone + " " + noVisibility + " " + outOfScreen() + " " + element.hidden);
    return displayNone ;//|| noVisibility || 
      /*outOfScreen() || element.hidden;*/
  },
  
  visible: function(element){
    if(this._hidden(element)){
      throw {
        level:  "Error",
        code: 3,
        message: "Element " + element.id.substring(0,20) + " is not visible!",
        toString: function(){return JSON.stringify(this);}
      }
    }
  },
  
  invisible: function(element){
    if(!this._hidden(element)){
      throw {
        level:  "Error",
        code: 3,
        message: "Element " + element.id.substring(0,20) + " is visible!",
        toString: function(){return JSON.stringify(this);}
      }
    }
  },
  
  equal: function(valA, valB) {
    if(!(valA === valB)){
      throw {
        level:  "Error",
        code: 3,
        message: "Elements " + JSON.stringify(valA).substring(0,20) + 
          " and " + JSON.stringify(valB).substring(0,20) + " aren't equal!",
        toString: function(){return JSON.stringify(this);}
      }
    }
  },
  
  loadTests: function(tests){
    for(var i=0; i<tests.length; i++){
        var script = document.createElement('script');
        script.src = tests[0];
        document.head.appendChild(script);
    }
  },

  //test callbacks
  // before/after - called on every test
  // XTest - called on the whole suite
  beforeTest: null,
  afterTest: null, 
  before: null,
  after: null,
  
  configuration: {},
  config: function(data){
    this.configuration.app = data.app || "";
    this.configuration.appVersion = data.appVersion || "";
    this.configuration.desc = data.desc || "";
    this.configuration.timestamp = new Date();
    this.configuration.key = data.key || "";
    
    return this;
  },
  
  endTest: function(){
    if(this._testSuccess){ // call only if part of test runner
      this._testSuccess();
    }
  }, 

  _testSuccess: null,  //setup in run()

  //TODO: rework and make DRY 
  play: function(scenario, failureCallback, successCallback){
    if(scenario.length <= 0){
      console.log("Playing scenario: end");
      return;
    }

    console.log("Playing scenario: start");
    var startTime;
    var step = scenario[0];

    console.log("Playing scenario: step " + step.name);
    startTime = new Date().getTime();

    var end = function(stopTime){
      var diff = stopTime - startTime;
      alert("DIFF: " + diff);
      if(diff >= step.howLong) {
        failureCallback({level: "2", message: "Scenario step timeout reached"});
      }
      Ash.play(scenario.splice(1), failureCallback, successCallback);
    }; 

    step.where.goto();
    step.where.validate();
      
    //TODO: is it the expected behaviour to call the original callback on each step?
    Ash.run(step.what, function(errorData){
      alert("FAIL");
      var stopTime = new Date().getTime();

      failureCallback(errorData);
      end(stopTime);
    }, function(successData){
      alert("OK");
      var stopTime = new Date().getTime();

      if(successCallback) successCallback(successData);
      end(stopTime);
    });
  },  

  run: function(tests, failureCallback, successCallback){
    var testsSuite = (Object.prototype.toString.call(tests) === "[object Array]") ? tests : this._extractTests(tests);
    var testSuiteLen = testsSuite.length;
    var currentTest = 0; 
    
    //before class event
    if(this.beforeClass){
      console.log("beforeClass event is called"); 
      this.beforeClass();
    }
    
    //setup testSuccess handler 
    if(!this._testSuccess){ 
      this._testSuccess = function(){
        if(this.after) {
          console.log("after event is called for success");
          this.after();
        };

        //TODO: send meaningful data. throw error to obtain stack?
        if(successCallback) successCallback({"index": currentTest, "length": testSuiteLen});
        if(++currentTest < testSuiteLen) {
          if(this.before) {
            console.log("before event is called after success");
            this.before();
          }
          testsSuite[currentTest]();
        }else{
          if(this.afterClass) {
            console.log("afterClass event is called for success");
            this.afterClass();
          }
        }
      }
    }
    
    //setup failure handler
    window.onerror = function(errorMsg, url, lineNumber) {
      if(this.after) {
        console.log("after event is called for failure");
        this.after();
      }

      alert("ON ERR:" + errorMsg);
      failureCallback(Ash._processException(errorMsg, url, lineNumber));

      if(currentTest++ < testSuiteLen) {
        if(this.before) {
          console.log("before event is called after failure");
          this.before();
        }
        testsSuite[currentTest]();
      }else{
        if(this.afterClass) {
          console.log("afterClass event is called for failure");
          this.afterClass();
        }
      }
    };
    
    if(this.before) {
      console.log("first before event is called");
      this.before();
    }
    testsSuite[currentTest]();
  },
  
  _processException: function(errorMsg, url, lineNumber){
    //TODO: handle JSON parse failure
    var testFailure = JSON.parse(errorMsg.replace("Uncaught ", ""));
    testFailure.level = testFailure.level || "Exception";
    testFailure.code = testFailure.code || 1;
    testFailure.message = testFailure.message || "Runtime error";
    testFailure.url = url;
    testFailure.lineNumber = lineNumber;
    return testFailure;
  },
  
  _extractTests: function(testObj){
    var testSuite = [];
    var searchPhrase = "Test";
    var searchPhraseLen = searchPhrase.length;
  
    for(var prop in testObj){
      var isFunction = typeof(testObj[prop]) === "function";
      var hasName = prop.indexOf(searchPhrase, this.length - searchPhraseLen) !== -1;
      if(isFunction && hasName){
        testSuite.push(testObj[prop]);
      }
    }
    return testSuite;
  },
  
  eventTimeout: 1000,  //most browsers won't react under 25 
  
  orientationHorizontal: function(testSuite) {
    return cordova.exec( 
      function(){
        //FIXME: walkaround for event synchronization problem
        setTimeout(function(){console.log("HorizontalTimeout Done");testSuite();}, Ash.eventTimeout);
      },
      function(e) { alert("Couldn't call orientationHorizontal " + JSON.stringify(e)); }, 
      "Ash", 
      "orientationHorizontal", 
      []);
  },
  
  orientationVertical: function(testSuite) {
    return cordova.exec( 
      function(){
        //FIXME: walkaround for event synchronization problem
        setTimeout(function(){console.log("VerticalTimeout Done");testSuite();}, Ash.eventTimeout);
      },
      function(e) { alert("Couldn't call orientationVertical " + JSON.stringify(e)); }, 
      "Ash", 
      "orientationVertical", 
      []);
  },
  
  noNetwork: function(testSuite) {
    return cordova.exec( 
      function(){
        testSuite();
      },
      function() { alert("Couldn't call noNetwork"); }, 
      "pl.ug.ash.AshPlugin", 
      "networkOff", 
      []);
  },
  
  withFile: function(options, callback) {
    //TODO: create/access real files
    var files = [];
    var len = options.limit || 1;
    for(var i=0; i<len; i++){
      var file = {
        "name": "file" + i,
        "fullPath": "/path/to/file" + i,
        "type": options.type || 'audio/amr',
        "lastModifiedDate": new Date(),
        "size": 100 + i
      }
      files.push(file);
    }
    callback(files);
  },
  
  onMove: function(startPos, options, callback) {
    //TODO: emulate instead of only simulating
    var steps = options.steps || 1;
    
    var startLatitude = startPos.latitude || 0;
    var destinationLatitude = options.latitude || 0;
    var skipLatitude = (destinationLatitude - startLatitude)/steps;
    
    var startLongitude = startPos.longitude || 0;
    var destinationLongitude = options.longitude || 0;
    var skipLongitude = (destinationLongitude - startLongitude)/steps;

    for(var i=0; i<=steps; i++){
      var lat = startLatitude + i*skipLatitude;
      var long = startLongitude = i*skipLongitude;
      var position = {"coords" : {"latitude": lat, "longitude": long}};
      callback(position);
    }
    //A.endTest();
  },
  
  //TODO: move this part to ash-navigation
  isOnPage: function(pageObject) {
    if(typeof(pageObject["validate"]) === "function") {
      var onPage = pageObject["validate"]();
      if(onPage === false){
        throw {
          level: "Error",
          code: 11,
          message: "Not on page!",
          toString: function(){return JSON.stringify(this);}
        }
      }
    }else{
      throw {
        level: "Error",
        code: 12,
        message: "Page element doesn't implement required method!",
        toString: function(){return JSON.stringify(this);}
      }
    }
  }
};

module.exports = Ash;
