import mongoose from "mongoose";
import app from "./app.js";
import config from "./app/config/index.js";

async function main() {
  try {
    await mongoose.connect(config.database_url as string);

    app.listen(Number(config.port), () => {
      console.log(`Example app listening on port ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
