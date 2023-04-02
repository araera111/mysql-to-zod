const target = "./dist/main.js";
const shebang = "#!/usr/bin/env node";

const fs = require("fs");

fs.readFile(target, function (err, data) {
  if (err) throw err;
  const newData = shebang + "\n" + data;
  fs.writeFile(target, newData, function (err) {
    if (err) throw err;
    console.log("Saved!");
  });
});
