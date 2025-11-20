// require('dotenv').config({path: './env'})
import "dotenv/config";
import connectDB from "@/db/connectDB";
import { app } from "@/app";
import { PORT } from "@/constants";
// dotenv.config({
//   path: "./.env",
// });

// connectDB()
//   .then(() => {
//     app.listen(PORT || 8000, () => {
//       console.log(`⚙️ Server is running at port : http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.log("MONGO db connection failed !!! ", err);
//   });

// Remove duplicate express app initialization and use the imported app
export const startServer = (async () => {
  try {
    await connectDB();
    app.on("mount", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("ERROR: ", error);
    process.exit(1);
  }
})();
