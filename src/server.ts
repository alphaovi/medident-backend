import mongoose from "mongoose";
import app from "./app.js";
import config from "./app/config/index.js"; // আপনার প্রজেক্টের কনফিগার পাথ অনুযায়ী চেক করে নিবেন

async function main() {
  try {
    // 🟢 ডাটাবেজ কানেকশন একবারই এস্টাবলিশ হবে
    await mongoose.connect(config.database_url as string);
    console.log("🗄️ Database connected successfully!");

    // লোকাল বা সার্ভারে পোর্ট লিসেন করা
    const port = Number(config.port) || 5000;
    app.listen(port, () => {
      console.log(`🚀 Example app listening on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Database connection error:", error);
  }
}

main();