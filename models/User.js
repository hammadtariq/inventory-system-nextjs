import { sequelize } from "../lib/dbConnect";
import Sequelize from "sequelize/dist";

const User = sequelize.define("user", {
  name: {
    type: Sequelize.STRING,
    allowedNull: false,
  },
});

export default User;
