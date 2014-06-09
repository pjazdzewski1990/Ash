/* ASH
var argscheck = require('cordova/argscheck'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec'),
    cordova = require('cordova');
*/
/**
 * Tool for making logging easier
 */
var Log = {
  data: [],
  getStackTrace: function() {
    var obj = {};
    Error.captureStackTrace(obj, this.getStackTrace);
    return obj.stack;
  },
  d: function(message, tag){
    if(!tag){
      tag = "ASH";  
    }
    var logMessage = tag + " : " + message + " at " + this.getStackTrace();
    console.log(logMessage);
    this._appendToLog(logMessage);
  },
  e: function(message, tag){
    if(!tag){
      tag = "ASH";  
    }
    var logMessage = tag + " : " + message + " at " + this.getStackTrace();
    console.log(logMessage);
    alert(logMessage);
    this._appendToLog(logMessage);
  },
  _appendToLog: function(logMessage){
    var sizeTreshhold = 100;
    if(this.data.length >= sizeTreshhold){
      this.data.shift();
    }
    this.data.push(logMessage);
  },
  dumpLog: function(){
    var fileName = new Date().toString().replace(/ /g, "_");
    console.log("Dumping log data to " + fileName);
    //TODO: implement
    alert("No implemented!");
  }
};

/** @namespace */
var Ash = {
  /**
   * stored default onerror hanlder
   */
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
      //array of html DOM elements can be considered hidden if all elements ...
      var elements = this._argToArray(args);
      Log.d("Check if hidden " + elements);
      
      // ... style is set to none or hidden
      var hiddenByStyle = elements.reduce(function(previousValue, element, index, array){
        return previousValue && element.style && (element.style.display === "none" || element.style.display === "hidden");
      }, true);
      if(hiddenByStyle) {
        Log.d("Hidden By Style");
        return true;
      }
      
      // or
      // ... are drawn outside document body
      var outOfScreen = function(element){
        var elementHeight = element.clientHeight;
        var elementWidth = element.clientWidth;
          
        var vertical = element.offsetTop + elementHeight < 0 || 
            element.offsetTop > document.body.offsetHeight;
        var horizontal = element.offsetLeft + elementWidth < 0 || 
            element.offsetLeft > document.body.offsetWidth;
      };
      var hiddenOutOfScreen = elements.reduce(function(previousValue, element, index, array){
        return previousValue && outOfScreen(element);
      }, true);
      if(hiddenOutOfScreen) {
        Log.d("Hidden Out Of Screen");
        return true;
      }
      
      //or
      // ... size is zero
      var hiddenByZeroSize = elements.reduce(function(previousValue, element, index, array){
        return previousValue && element.offsetWidth==0 && element.offsetHeight==0;
      }, true);
      if(hiddenByZeroSize) {
        Log.d("Hidden By Zero Size");
        return true;
      }
      
      //or
      // ... visibility is set to hidden
      var hiddenByVisibility = elements.reduce(function(previousValue, element, index, array){
        return previousValue && element.style && element.style.visibility === "hidden";
      }, true);
      if(hiddenByVisibility) {
        Log.d("Hidden By Visibility");
        return true;
      }
      
      //or
      // ... hidden property is simply set to true
      var hiddenByHiddenProperty = elements.reduce(function(previousValue, element, index, array){
        return previousValue && element.hidden === true;
      }, true);
      if(hiddenByHiddenProperty) {
        Log.d("Hidden By Hidden Property");
        return true;
      }
      
      Log.d("Element is visible");
      return false;
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
        message: "Element " + ((element && element.id)? element.id.substring(0,20) : "element") + " is not visible!",
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
        code: 4,
        message: "Element " + ((element && element.id)? element.id.substring(0,20) : "element") + " is visible!",
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
      var msg = "Elements " + (valA? JSON.stringify(valA).substring(0,20) : valA) + 
          " and " + (valB? JSON.stringify(valB).substring(0,20) : valB) + " aren't equal!";
      throw {
        level:  "Error",
        code: 5,
        message: msg,
        toString: function(){return JSON.stringify(this);}
      }
    }
  },

  equals: function(valA, valB) {
      this.equal(valA, valB);
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
    
  callbacks: {
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
  },
  
  configuration: {},
  config: function(data){
    this.configuration.app = data.app || "";
    this.configuration.appVersion = data.appVersion || "";
    this.configuration.desc = data.desc || "";
    this.configuration.timestamp = new Date();
    this.configuration.key = data.key || "";
    
    return this;
  },
  
  /**
   * Calling this method ends current te when running via 'run' or 'play'
   */
  endTest: function(){
    Log.d("endTest called");
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
    
    Log.d("Playing scenario: start");
    var testIndex = 0;
    var step = scenario[testIndex];

    var checkTimoutAndRecurse = function(step, startTime, stopTime){
      var diff = stopTime - startTime;
      //alert("DIFF: " + diff + " HOWLONG: " + step.howLong);
      if(diff >= step.howLong) {
        Log.d("Timeout was of " + step.howLong + " reached by test. Actual is " + diff);
        failureCallback({level: "error", message: "Scenario step timeout reached"});
      }
      testIndex++;
      _play();
    }; 
      
    var _play = function(){
      console.log("Playing test " + testIndex + " out of " + scenario.length);
      if(scenario.length <= testIndex){
        Log.d("Playing scenario: end");
        return;
      }
      var step = scenario[testIndex];
        
      Log.d("Playing scenario: step " + step.name);
      var startTime = new Date().getTime();
  
      step.where.goto();
      step.where.validate();
        
      //TODO: is it the expected behaviour to call the original callback on each step?
      Ash.run(step.what, function(errorData){
        // alert("FAIL");
        var stopTime = new Date().getTime();

        failureCallback(errorData);
        checkTimoutAndRecurse(step, startTime, stopTime);
      }, function(successData){
        // alert("OK");
        var stopTime = new Date().getTime();

        successData.startTime = startTime;
        successData.stopTime = stopTime;
        successData.index = testIndex;
        successData.length = scenario.length;
      
        if(successCallback) successCallback(successData);
        checkTimoutAndRecurse(step, startTime, stopTime);
      });  
    }; 
     
    _play();
  },  

  
  //TODO: rework this cluttered code!
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
      Log.d("Reseting Globals");
      Ash._testSuccess = null;
      window.onerror = Ash._storedErrorCallback;
    };
      
    //before class event
    if(this.beforeClass){
      Log.d("beforeClass event is called"); 
      this.beforeClass();
    }
    
    
    //setup testSuccess handler 
    if(!this._testSuccess){ 
      this._testSuccess = function(){
        if(this.callbacks.after) {
          Log.d("After event is called for success");
          this.callbacks.after();
        };

        if(++currentTest < testSuiteLen) {
          //TODO: send meaningful data. throw error to obtain stack?
          if(successCallback) successCallback({"index": currentTest, "length": testSuiteLen});    
        
          if(this.callbacks.before) {
            Log.d("Before event is called after success");
            this.callbacks.before();
          }
          
          testsSuite[currentTest]();
        }else{
          resetGlobals();
            
          //TODO: send meaningful data. throw error to obtain stack?
          if(successCallback) successCallback({"index": currentTest, "length": testSuiteLen});
          
          if(this.callbacks.afterClass) {
            Log.d("AfterClass event is called for success");
            this.callbacks.afterClass();
          }
        }
      }
    }
    
    //setup failure handler
    //TODO: consider merging (by chaining) onerror handlers instead 
    window.onerror = function(errorMsg, url, lineNumber) {
      console.log("error handler is triggered with errorMsg:" + errorMsg + " url:" + url + " lineNumber:" + lineNumber);
      if(Ash.callbacks.after) {
        Log.d("After event is called for failure");
        Ash.callbacks.after();
      }

      Log.e("ON ERR:" + errorMsg);
      failureCallback(Ash._processException(errorMsg, url, lineNumber));

      if(currentTest++ < testSuiteLen) {
        if(Ash.callbacks.before) {
          Log.d("Before event is called after failure");
          Ash.callbacks.before();
        }
        testsSuite[currentTest]();
      }else{
        resetGlobals();
        if(Ash.callbacks.afterClass) {
          Log.d("AfterClass event is called for failure");
          Ash.callbacks.afterClass();
        }
      }
    };
    
    if(this.callbacks.before) {
      Log.d("first before event is called");
      this.callbacks.before();
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
  
  eventTimeout: 1000,  //most browsers won't react under 25, sadly we need even more time
  
    //TODO: there is a minor problem with these calls when the start orientation is not 0
  /**
  * Changes screen orientation to horizontal (landscape) in an async manner. The function returns a promise which allows to run tests via 'then' method. There is no guarantee that after the test orientation will change back to previous setting
  */
  orientationHorizontal: function() {
    Log.d("orientationHorizontal called");
    return new AshPromise(function (resolve, reject) {
        cordova.exec( 
            function(a){
                //FIXME: walkaround for event synchronization problem
                setTimeout(function(){
                    Log.d("HorizontalTimeout Done");
                    resolve(a);
                }, Ash.eventTimeout);
            },
            function(e){ 
                Log.e("Couldn't call orientationHorizontal " + JSON.stringify(e));
                reject(e);
            }, 
        "Ash", 
        "orientationHorizontal", 
        []);
    });
  },
  
  /**
  * Changes screen orientation to vertical (portrait) in an async manner. The function returns a promise which allows to run tests via 'then' method. There is no guarantee that after the test orientation will change back to previous setting
  */
  orientationVertical: function() {
    Log.d("orientationVertical called");
    return new AshPromise(function (resolve, reject) { 
        cordova.exec( 
            function(a){
                //FIXME: walkaround for event synchronization problem
                setTimeout(function(){
                    Log.d("VerticalTimeout Done");
                    resolve(a);
                }, Ash.eventTimeout);
            },
            function(e){ 
                Log.e("Couldn't call orientationVertical " + JSON.stringify(e)); 
                reject(e);
            }, 
        "Ash", 
        "orientationVertical", 
        []);
    });    
  },
  
  /**
  * Turns off the network and runs provided test function asynchronously. Function returns promise
  */
  noNetwork: function() {
    Log.d("noNetwork called");
    return new AshPromise(function (resolve, reject) { 
        cordova.exec( 
            function(a){
                //only if network plugin is attached
                if(navigator && navigator.connection && navigator.connection.type && Connection){
                    navigator.connection.type = Connection.NONE;
                    cordova.fireDocumentEvent("offline");
                }
                Log.d("Network has been turned off");
                resolve(a);
            },
            function(s) { 
                Log.e("Couldn't call noNetwork " + s); 
                reject(e);
            }, 
        "Ash", 
        "networkOff", 
        []);
    });
  },
    
  /**
  * Turns the network back to previus state (which still might mean offline if device is not connected) and runs provided test function asynchronously. Function returns promise
  */
  networkOn: function() {
    Log.d("networkOn called");
    return new AshPromise(function (resolve, reject) { 
        cordova.exec( 
            function(a){
                Log.d("Network has been broght back");
                if(navigator && navigator.connection && navigator.connection.type && Connection){
                    //var connection = new NetworkConnection();
                    navigator.connection.getInfo(function(info){
                        navigator.connection.type = info;
                        cordova.fireDocumentEvent("online");
                        resolve(a);        
                    }, function(msg){
                        reject(e);
                    })
                }else{
                    resolve(a);
                }
            },
            function(s) { 
                Log.e("Couldn't call networkOn " + s); 
                reject(e);
            }, 
        "Ash", 
        "networkOn", 
        []);
    });
  },
    
  /**
  * After calling this method each network call will have a singificant delay. Function returns promise
  */
  slowNetwork: function() {
    Log.d("slowNetwork called");
    return new AshPromise(function (resolve, reject) { 
        cordova.exec( 
            function(a){
                Log.d("Network has been slown down");
                if(navigator && navigator.connection && navigator.connection.type && Connection){
                    navigator.connection.getInfo(function(info){
                        navigator.connection.type = info;
                        cordova.fireDocumentEvent("online");
                        resolve(a);        
                    }, function(msg){
                        reject(e);
                    });
                }else{
                    resolve(a);
                }
            },
            function(s) { 
                Log.e("Couldn't call slowNetwork " + s); 
                reject(e);
            }, 
        "Ash", 
        "networkSlow", 
        []);
    });
  },
    
  /**
  * Simulates back button press. Function returns promise
  */
  pressBack: function() {
    Log.d("pressBack called");
    return new AshPromise(function (resolve, reject) { 
        cordova.exec( 
            function(a){
                Log.d("Back has been pressed");
                resolve(a);
            },
            function(s) { 
                Log.e("Couldn't press the back button " + s); 
                reject(e);
            }, 
        "Ash", 
        "pressBack", 
        []);
    });
  },
  
  /**
  * Creates an array of file. Each returned file conforms to requirements passed as "options" argument. Returns a promise which is resolved with the file array, when they are ready
  * @param {Object} options Requirements for files. Files in the array passed to testSuite callback are required to meet conditions specified in options
  */
  withFile: function(options, callback) {
    Log.d("withFile called with options:" + JSON.stringify(options));
    return new AshPromise(function (resolve, reject) { 
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
            };
            files.push(file);
        }
        resolve(files);
    });
  },
  
  /**
  * Simulate user movement. User starts in position startPos expressed as object with two fields: latitude and longitude. Movement is defined by options object contaning: step - how many steps will be provided, latitude and logitude - define the end position. On each step the callback is called with current location - an object containing a "coords" key with 2 further keys - latitude and logitude set (the rest is defaulted)
  * @param {Object} startPos Movement starting position
  * @param {Callback} options Options for configuring movement
  * @param {Callback} callback The callback function performing the test
  */
  onMove: function(startPos, options, callback) {
    Log.d("onMove called with startPos:" + JSON.stringify(startPos) + " options:" + JSON.stringify(options) + " callback:" + callback);
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
      var position = {"coords" : {"latitude": lat, "longitude": long, altitude: 0, accuracy: 0, altitudeAccuracy: 0, heading: 0, speed: 0}, timestamp: 0};
      Log.d("onMove callback is running " + i + "-th time with position " + position);
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

/* ASh
module.exports = Ash;
*/
window.Log = Log;
window.Ash = Ash;
