import express from "express";
import { SerialPort } from "serialport";

const app = express();
const baudRate = 115200;
let selectedPort = null;
let serialPort = null;

app.get("/serial/detect", async (req, res) => {
  try {
    const ports = await SerialPort.list();

    if (ports.length === 0) {
      return res.status(404).json({
        message: "No serial ports found",
      });
    }

    const activePorts = ports.filter(
      (port) => port.manufacturer && port.manufacturer !== "Unknown"
    );

    if (activePorts.length === 0) {
      return res.status(404).json({
        message: "Tidak ada port serial yang aktif atau dapat digunakan.",
      });
    }

    const portList = activePorts.map((port, index) => ({
      id: index + 1,
      path: port.path,
      manufacturer: port.manufacturer || "Unknown",
    }));

    return res.json(portList);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/serial/:portNumber", async (req, res) => {
  const { portNumber } = req.params;

  try {
    const ports = await SerialPort.list();
    const selectedIndex = parseInt(portNumber, 10) - 1;

    if (
      isNaN(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= ports.length
    ) {
      return res.status(400).json({ message: "Nomor port tidak valid." });
    }

    const selectedPortInfo = ports[selectedIndex];
    selectedPort = selectedPortInfo.path;

    if (serialPort && serialPort.isOpen) {
      serialPort.close((err) => {
        if (err) console.error("Gagal menutup port lama:", err.message);
      });
    }

    serialPort = new SerialPort({
      path: selectedPort,
      baudRate: baudRate,
    });

    serialPort.on("open", () => {
      console.log(`Port ${selectedPort} berhasil dibuka.`);
    });

    serialPort.on("error", (err) => {
      console.error("Error pada serial port:", err.message);
    });

    return res.json({ message: `Port ${selectedPort} berhasil dipilih.` });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Gagal memilih port serial.", error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
