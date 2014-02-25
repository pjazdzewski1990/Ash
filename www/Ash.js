
var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec');
  
/** @namespace */
var Ash = {
  _storedErrorCallback: window.onerror,

  /**
   * Make sure the element is present
   * @param {DOMElement} What to inspect
   * @throws {AshElementNotFound} If element is "falsy" 
   */
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
  
  _argToArray: function(arg){
      if(arg instanceof Array) {
          return arg;
      }
      if(arg instanceof jQuery) {
          return arg.toArray();
      }
      return [arg];
  },
    
  _hidden: function(args) {
      var elements = this._argToArray(args);
      return elements.reduce(function(previousValue, element, index, array){
        return previousValue && element.style && element.style.display === "none";
      }, true);
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
    
    //var displayNone = element.style && element.style.display === "none";
//    var noVisibility = ["hidden", "collapse"].indexOf(element.style.visibility)>-1;
//    console.log("_hidden: " + displayNone + " " + noVisibility + " " + outOfScreen() + " " + element.hidden);
    //return displayNone || noVisibility || 
    //outOfScreen() || element.hidden;
  },

  /**
   * Make sure the element is visible, if not throw error
   * @param {DOMElement} DOM element needing inspection
   * @throws {AshElementInvisible} Thrown if the element is visible to the user 
   */
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
   
  /**
   * Returns boolean indicating whether the specified element is visible 
   * @param {DOMElement} DOM element needing inspection
   * @return {Boolean} False if the element is hidden, True otherwise
   */
  isVisible: function(element){
    return !this._hidden(element);
  },
  
  /**
   * Make sure the element is hidden from the user
   * @param {DOMElement} What to inspect
   * @throws {AshElementVisible} If element is is invisible to the user 
   */
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
  
  /**
   * Make sure the element is hidden from the user
   * @param {DOMElement} What to inspect
   * @returns {Boolean} If element is is invisible to the user 
   */
  isInvisible: function(element){
    return this._hidden(element);
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
  
  /**
   * Load the js files that contain test code as script tags
   * @param {Array} Array of strings being paths to access test files
   */
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
  /** Runs before the whole test set */
  beforeTest: null,
  /** Runs after the whole test set has run */
  afterTest: null, 
  /** Runs before each test */
  before: null,
  /** Runs after each test */
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
  
  /**st
   * Calling this method ends current te when running via 'run' or 'play'
   */
  endTest: function(){
    if(this._testSuccess){ // call only if part of test runner
      this._testSuccess();
    }
  }, 

  _testSuccess: null,  //setup in run()

  //TODO: rework and make DRY
  /**
  * Runs tests in a scenario according to the context 
  * @param {AshScenario} scenario The scenario that will be runned 
  * @param {Callback} failureCallback Callback that is called for each test that fails
  * @param {Callback} successCallback Callback that is called when test succeeds
  */
  play: function(scenario, failureCallback, successCallback){
    
    console.log("Playing scenario: start");
    var testIndex = 0;
    var step = scenario[testIndex];

    var end = function(step, startTime, stopTime){
      var diff = stopTime - startTime;
      // alert("DIFF: " + diff);
      if(diff >= step.howLong) {
        failureCallback({level: "error", message: "Scenario step timeout reached"});
      }
      testIndex++;
      _play();
    }; 
      
    var _play = function(){
        alert("SCENario " + scenario + " " + testIndex);
      
      if(scenario.length <= testIndex){
        console.log("Playing scenario: end");
        return;
      }
      var step = scenario[testIndex];
        
      console.log("Playing scenario: step " + step.name);
      var startTime = new Date().getTime();
  
      step.where.goto();
      step.where.validate();
        
      //TODO: is it the expected behaviour to call the original callback on each step?
      Ash.run(step.what, function(errorData){
        // alert("FAIL");
        var stopTime = new Date().getTime();

        failureCallback(errorData);
        end(step, startTime, stopTime);
      }, function(successData){
        // alert("OK");
        var stopTime = new Date().getTime();

        successData.stopTime = stopTime;
        successData.index = testIndex;
        successData.length = scenario.length;
      
        if(successCallback) successCallback(successData);
        end(step, startTime, stopTime);
      });  
    }; 
     
    _play();
  },  

  /**
  * Runs tests in a array one-by-one without the context information 
  * @param {AshScenario} tests The scenario that will be runned 
  * @param {Callback} failureCallback Callback that is called for each test that fails
  * @param {Callback} successCallback Callback that is called when test succeeds
  */
  run: function(tests, failureCallback, successCallback){
    var testsSuite = (Object.prototype.toString.call(tests) === "[object Array]") ? tests : this._extractTests(tests);
    var testSuiteLen = testsSuite.length;
    var currentTest = 0; 
    
    var resetGlobals = function(){
      Ash._testSuccess = null;
      window.onerror = Ash._storedErrorCallback;
    };
      
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
          resetGlobals();
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
        resetGlobals();
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
  
  /**
  * Changes screen orientation to horizontal (landscape). After the orientation changed passed function is called. There is no guarantee that after the test orientation will change back to previous setting
  * @param {Callback} testSuite The callback function performing the test
  */
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
  
  /**
  * Changes screen orientation to vertical (portrait). After the orientation changed passed function is called. There is no guarantee that after the test orientation will change back to previous setting
  * @param {Callback} testSuite The callback function performing the test 
  */
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
  
  /**
  * Turns off the network and runs provided test function
  * @param {Callback} testSuite The callback function performing the test 
  */
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
  
  /**
  * Passes an array of files fullfilling requirements specified in options argument to provided callback function
  * @param {Callback} options Requirements for files. Files in the array passed to testSuite callback are required to meet conditions specified in options
  * @param {Callback} testSuite The callback function performing the test
  */
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
  
  /**
  * Simulate user movement. User starts in position startPos expressed as object with two fields: latitude and longitude. Movement is defined by options object contaning: step - how many steps will be provided, latitude and logitude - define the end position. On each step the callback is called with current location - an object containing a "coords" key with 2 further keys - latitude and logitude
  * @param {Object} startPos Movement starting position
  * @param {Callback} options Options for configuring movement
  * @param {Callback} callback The callback function performing the test
  */
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
  /**
  * Tests if current screen conforms to passed PageObject's validate function. If no an exception is thrown 
  * @param {PageObject} pageObject Current screen is validated against this screen
  * @throws {AshException} If the page object doesn't have a "validate" method 
  * @throws {AshException} If the current screen doesn't conform tp pageObject's validate method
  */
  onPage: function(pageObject) {
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
