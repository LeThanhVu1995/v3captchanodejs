const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const secretKey = "6Ldb9_gfAAAAAHlu5NBDdueW-JHSaK7rsGx8XtlE";
const xlsx = require("xlsx");
const app = express();

const filename = "whitelist.xlsx";
const SHEET_WORKING = "Sheet1";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

function writeFileXlsx(data) {
  const workbook = xlsx.readFile(filename);
  const worksheets = readFileXlsx(SHEET_WORKING);
  worksheets.push(data);
  xlsx.utils.sheet_add_json(workbook.Sheets[SHEET_WORKING], worksheets);
  xlsx.writeFile(workbook, filename);
}

function readFileXlsx(sheet) {
  const workbook = xlsx.readFile(filename);

  let worksheets = {};
  for (const sheetName of workbook.SheetNames) {
    worksheets[sheetName] = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetName]
    );
  }
  return worksheets[sheet];
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/download", (req, res) => {
  res.download(__dirname + "/whitelist.xlsx");
});

app.post("/subscribe", (req, res) => {
  if (!req.body.captcha) {
    return res.json({ success: false, msg: "Capctha is not checked" });
  }

  const data = req.body;
  data.ip = req.connection.remoteAddress;
  delete data.captcha;

  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;

  request(verifyUrl, (err, response, body) => {
    if (err) {
      console.log(err);
    }

    body = JSON.parse(body);
    if (!body.success) {
      return res.json({ success: false, msg: "captcha verification failed" });
    }

    if (body.score < 0.5) {
      return res.json({ success: false, msg: "you might be a bot" });
    }

    writeFileXlsx(data);
    return res.json({ success: true });
  });
});

app.listen(3000, () => {
  console.log("server is now up!");
});
