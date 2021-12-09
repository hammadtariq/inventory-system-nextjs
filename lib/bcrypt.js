import bcrypt from "bcrypt";

export const createHash = async (password) => {
  try {
    if (!password) {
      throw new Error("Password can not be empty");
    }
    const saltRound = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, saltRound);
    return hash;
  } catch (error) {
    console.log(error);
  }
};

export const compareHash = async (password, hash) => {
  try {
    if (!password || !hash) {
      throw new Error("Please provide password and hash");
    }
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.log(error);
  }
};
