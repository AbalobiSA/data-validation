module.exports = {

  //this test checks firstly to see if it is a weekday. If it is it then proceeds,
  //to check if any monitor records were received

  runTest : function(client,  startdate, enddate, success, error){

    //initialize logging for every console.log
    var LogString = "";

    console.log("Monitor Tests: \n\nTest 1: Monitor Day Records Received Test:")
    LogString += "Monitor Tests: \n\nTest 1: Monitor Day Records Received Test:\n"

    //get today's date and then get the current day from the date
    var current_timestamp = new Date();
    var current_day = current_timestamp.getDay()

    //if today is a weekday run tests else callback
    if (current_day > 0 && current_day < 6 ){

      console.log("Day is weekday - checking for records...")
      LogString += "Day is weekday- checking for records...\n"


      client
      .query('SELECT * FROM salesforce.ablb_monitor_day__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
      .on('end', function(result) {
        if (result.rowCount > 0){
          console.log(result.rowCount + " Records Received - Passed\r\n")
          LogString += result.rowCount + " Records Received - Passed\n\n"
          success(LogString)
        }
        else{
          console.log("No Records Received - Failed \r\n")
          LogString += "No Records Received - Failed \n\n"
          error(LogString);
        }
      })
    }

    else {
      console.log("Not a Weekday Monitor - Test Not Run")
      LogString += "Not a Weekday Monitor - Test Not Run\n"
      error(Logstring);
    }
  }
}
