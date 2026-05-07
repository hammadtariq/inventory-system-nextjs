import nextConnect from "next-connect";

const signup = async (req, res) => {
  console.log("Sign up Request Start");

  return res.status(410).send({
    message: "Legacy user signup is disabled. Create users through an organization onboarding flow.",
  });
};

export default nextConnect().post(signup);
