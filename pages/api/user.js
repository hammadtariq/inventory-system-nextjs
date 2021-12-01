import dbConnect from "../../lib/dbConnect";
import User from "../../models/User";

export default async function user(req, res) {
  await dbConnect();
  const user = await User.create({ name: "rehan" });
  res.send({ user });
}
