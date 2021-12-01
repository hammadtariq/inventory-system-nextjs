import dbConnect from "../../lib/dbConnect";
import Post from "../../models/post";

export default async function user(req, res) {
  await dbConnect();
  const post = await Post.create({ title: "post one" });
  res.send({ post });
}
