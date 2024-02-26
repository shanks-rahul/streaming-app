import app from "./app.js";
import connectToDB from "./db/configs/dbConn.js";
const PORT=process.env.PORT;
app.listen(PORT,async()=>{
    await connectToDB();
    console.log(`App is running at http://localhost:${PORT}`);
})