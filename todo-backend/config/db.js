import { connect } from 'mongoose';

const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI);
    console.log('MongoDB Database connected Successfully!');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;
