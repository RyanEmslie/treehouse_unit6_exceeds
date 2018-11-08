//required
const http = require("http");
const fs = require("fs");
//required modules installed with npm
const converter = require("json-2-csv");
const cheerio = require("cheerio");

//global arrays
const linksArr = [];
const shirtArr = [];
let statusCodeError = "";

try {
  //Test for 404 Error by entering ..../shorts.php - "Mike don't sell no shorts!!"
  const request = http.get(`http://shirts4mike.com/shirts.php`, response => {
   
    if (response.statusCode != `200`) {
      if (response.statusCode == `404`) {
        // printError()
        console.log(
          `\nDOH!! Website cannot be found!! Please re-check the URL\n${
            response.statusCode
          } error occurred.`
        );
        let error = new Error(`Status Code: 404 error`);
        printError(error);
      } else {
        console.log(
          `\nUh-Oh! Something went wrong. Please try again later\n${
            response.statusCode
          }`
        );
        let error = new Error(`Status Code: ${
          response.statusCode
        } error`);
        printError(error);
      }
    }

    let body = "";

    response.on("data", data => {
      body += data.toString();
    }); //on

    response.on("end", () => {
      const $ = cheerio.load(body);
      //Loop that populates array with shirt links
      $(".products li a").each((i, el) => {
        const shirtLink = $(el).attr("href");
        linksArr.push(shirtLink);
      }); //each loop

      //Function calls main scrapping functions
      startScrape();
      
    }); //end
  }); //end get

  request.on("error", function(error) {
    console.log("\nError Caught: " + error.message);
    printError(error);
  });
} catch (error) {
  console.error(error.message);
  printError(error);
}

function startScrape() {
  //Loop through array of links
  for (let i = 0; i < linksArr.length; i++) {
    http.get(`http://shirts4mike.com/${linksArr[i]}`, response => {
      let body = "";

      response.on("data", data => {
        body += data.toString();
      });

      response.on("end", () => {
        //Cheerio module allowing jQuery DOM selectors
        const $ = cheerio.load(body);
        const title = $("div.shirt-details h1")
          .text()
          .slice(4)
          .replace(/,/, "");
        const price = $("h1 .price").html();
        const link = `http://shirts4mike.com/${linksArr[i]}`;
        const imageUrl = $("div.shirt-picture img").attr("src");
        const time = new Date().toString().slice(16);
        shirtArr.push({ title, price, imageUrl, link, time });

        //conditional prevents calling writing function util array is full
        if (shirtArr.length === 8) {
          //for testing
          // console.log(shirtArr)
          writeToFile();
        }
      }); //end response
    });
  } //end for loop
} //end startScrape

function writeToFile() {
  try {
    //function taken from json-2-csv documentation
    const json2Callback = function(error, csv) {
      if (error) throw errorHandler(error);
      //conditional to make directory if it doesn't exist
      if (!fs.existsSync("./data")) {
        fs.mkdirSync("./data");
      }
      const writeStream = fs.createWriteStream(`./data/${fileDate()}.csv`);
      writeStream.write(csv);
      console.log(`\n.......New File Created - ${new Date()}........`);
    };

    //from the json-2-csv module
    converter.json2csv(shirtArr, json2Callback);
  } catch (error) {
    printError(error);
  }
} //end writeToFile

//Function that formats date for csv file name
// only one file per day can be created using this format
function fileDate() {
  let d = new Date();
  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  if (month.length < 2) {
    month = "0" + month;
  }
  if (day.length < 2) {
    day = "0" + day;
  }
  return [year, month, day].join("-");
} // end fileDate

//Print Error Messages
function printError(error) {
  if (!fs.existsSync("scraper-error.log")) {
    fs.createWriteStream("scraper-error.log");
  }
 
 
  let errorEvent = `${new Date()} ${error.message}\n`;
  console.log(
    `\n"${error.message}" error occurred on - ${new Date()}\n Error Logged!`
  );
  // Write the file
  fs.appendFileSync("scraper-error.log", errorEvent, function(error) {
    console.log("An error has been logged to scraper-error.log");
  });
}



