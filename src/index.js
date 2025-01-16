import express from "express";
import { SerialPort } from "serialport";
import { ReadlineParser } from "serialport";

const app = express();

app.set("view engine", "pug");
app.set("views", "./views");

const portName = "/dev/ttyUSB0";
const baudRate = 115200;

const port = new SerialPort({
  path: portName,
  baudRate: baudRate,
});

const dataReceived = [];
const maxDisplayData = 10;

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

parser.on("data", (data) => {
  try {
    const receivedObject = JSON.parse(data);

    dataReceived.push({
      Timestamp: new Date().toLocaleString(),
      Temperature: receivedObject.temperature,
      Humidity: receivedObject.humidity,
      pH: receivedObject.ph,
    });

    if (dataReceived.length > 1000) {
      dataReceived.shift();
    }
  } catch (error) {
    console.error("Error parsling data: ", error.message);
  }
});

app.get("/", (req, res) => {
  res.render("index", {
    data: dataReceived.slice(-maxDisplayData),
  });
});

app.get("/data", (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedData = dataReceived.slice(startIndex, endIndex);
  const totalPages = Math.ceil(dataReceived.length / limit);

  res.json({
    currentPage: page,
    totalPages: totalPages,
    data: paginatedData,
  });
});

app.get("/data/all", (req, res) => {
  res.json(dataReceived);
});

app.post("/data/clear", (req, res) => {
  dataReceived.length = 0;
  res.json({ message: "Data cleared" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
