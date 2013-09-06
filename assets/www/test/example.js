
if(!window.tests){
  var exampleTests = {};
  
  exampleTests.orientationTest = function(){
    A.orientationHorizontal(function(msg){
      var element = $('#deviceorientationField');
      A.assert(element);
      A.assertEqual(element.text(), "landscape");
      
      A.orientationVertical(function(){
       var element = $('#deviceorientationField');
       A.assert(element);
       A.assertEqual(element.text(), "portrait");
     });
    });
  };
  
//  exampleTests.connectionTest = function(){
//    alert("connectionTest");
//    A.noNetwork(function(msg){
//      alert("network mode off");
//      app.setConnectionBox();
//      
//      A.assertEqual($('#connectionField').text(), 'No network connection');
//    });
//  };
  
  exampleTests.runAll = function(){
    var conf = {app: "Ash Demo", appVersion: "0.1", desc: "Demo app for ASH testing framework", key: "demo"};
    A.config(conf).run(this, function(errorData){
      alert("Fail!! " + JSON.stringify(errorData));
      var failNum = errorData.failure.length;
      for(var i=0; i<failNum; i++){
        exampleTests.appendResult(errorData.failure[i].level, errorData.failure[i].message);
      }
    }, function(successData){
      alert("Success!! " + JSON.stringify(successData));
      exampleTests.appendResult("Success", successData.success.length);
    })
  };
  
  exampleTests.appendResult = function(name, result){
    var tableRow = "<tr><td>" + name + "</td><td>" + result + "</td></tr>";
    $('#tableBody').append(tableRow);
  };
  
  window.tests = exampleTests;
};