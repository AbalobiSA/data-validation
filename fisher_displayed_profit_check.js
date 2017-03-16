module.exports = {

  runTest : function(client,  startdate, enddate,  callback){

    /*test that calculates the expected profit from a trip by adding expenses and totaling income from catches
    and compares whether that is equal to the displayed profit field in the trip record.*/

    var trips = [];
    var entry = 0;
    var errors = 0
    var LogString = "";

    console.log("Test 4: Displayed Profit Check: ");
    LogString += "Test 4: Displayed Profit Check: \n"

    //query all trips within given time period
    client
    .query('SELECT * FROM salesforce.ablb_fisher_trip__c WHERE lastmodifieddate BETWEEN \'' + startdate + '\' AND \'' + enddate + '\'')
    .on('row', function(row) {

      //if a trip has taken place
      if (row.trip_has__c == 'yes' && row.displayed_profit__c != null){
        trips.push(row)
      }

    })

    .on('end', function(result) {

      console.log(result.rowCount + ' records were received')
      LogString += result.rowCount + ' records were received\n'

      //total income and expense per trip
      var total_cost = 0
      var total_income = 0

      //NB please not how iterator is used! Ensures for loop works sync and not async!
      for (entry in trips){

        //query all catches where parent uuid is that of current trip
        var query = 'SELECT * FROM salesforce.ablb_fisher_catch__c WHERE odk_parent_uuid__c = \'' + trips[entry].odk_uuid__c + '\''
        var iterator = 0;

        client
        .query(query)
        .on('row', function(row){
          income(row, function(returned_income){
            total_income += returned_income;
          })
        })
        .on('end', function(result) {

          //if the trips has any costs calculate the total costs
          if (trips[iterator].cost_has__c == 'yes'){

            total_cost += trips[iterator].cost_bait__c
            total_cost += trips[iterator].cost_food__c
            total_cost += trips[iterator].cost_fuel__c
            total_cost += trips[iterator].cost_harbour_fee__c
            total_cost += trips[iterator].cost_oil__c
            total_cost += trips[iterator].cost_other_amount__c
            total_cost += trips[iterator].cost_transport__c
          }

          //calculate the expected profit for trip
          var profit = total_income - total_cost

          //if the profit is not equal to displayed profit flag error and handle all faketrips
          if (profit != trips[iterator].displayed_profit__c && !((trips[iterator].odk_uuid__c).includes("faketrip"))  ){
            console.log("Error @ sfID " + trips[iterator].sfid  );
            LogString += "Error @ sfID " + trips[iterator].sfid + " https://eu5.salesforce.com/" + trips[iterator].sfid + '\n'
            errors++;
          }

          //reset all fields and increment iterator
          total_cost = 0
          total_income = 0
          iterator++;

          //if for loop is complete
          if (iterator == trips.length){

            if (errors == 0){
              console.log("0 Errors - Test PASSED \n");
              LogString +="0 Errors - Test PASSED \n"
              callback(LogString, errors);
            }
            else{
              //output the total amount of users who are a mismatch
              console.log(errors + " Errors - Test FAILED \r\n");
              LogString += errors + " Errors - Test FAILED \n"
              callback(LogString, errors);
            }

          }
        })
      }
    })

    //calculate total income of a catch handling different scenarios for price type
    function income(each_catch, callback){

      var total_income = 0

      //handle sold to coop
      switch(each_catch.coop_price_type__c) {
        case 'per_item':
        total_income += each_catch.coop_price_per_item__c * each_catch.alloc_coop_number__c;
        break;

        case 'per_kg':
        total_income += each_catch.coop_price_per_kg__c * each_catch.alloc_coop_weight_kg__c;
        break;

        case 'per_crate':
        total_income += each_catch.coop_price_per_crate__c * each_catch.alloc_coop_crates__c;
        break;

        case 'total_batch':
        total_income += each_catch.coop_price_for_total_batch__c;
        break;
      }

      //handle sold to other
      switch(each_catch.other_price_type__c) {
        case 'per_item':
        total_income += each_catch.other_price_per_item__c * each_catch.alloc_sold_number__c;
        break;

        case 'per_kg':
        total_income += each_catch.other_price_per_kg__c * each_catch.alloc_sold_weight_kg__c;
        break;

        case 'per_crate':
        total_income += each_catch.other_price_per_crate__c * each_catch.alloc_sold_crates__c;
        break;

        case 'total_batch':
        total_income += each_catch.other_price_for_total_batch__c;
        break;
      }
      callback(total_income)
    }
  }
}