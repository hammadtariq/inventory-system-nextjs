import nextConnect from "next-connect";

const onNoMatch = async (req, res) => {
  res.status(405).send({
    success: false,
    error: `Requested ${req.method} method not allowed`,
  });
};

export const apiHandler = nextConnect({ onNoMatch });
