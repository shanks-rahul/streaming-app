import mongoose from 'mongoose';
mongoose.set("strictQuery",false);
const connectToDB = async()=>{
    try {
        const {connection}=await mongoose.connect(
            "mongodb://127.0.0.1:27017/STREAM"
        );
        if(connection){
            console.log(`connected to database : ${connection.host}`);
        }
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}
export default connectToDB;
