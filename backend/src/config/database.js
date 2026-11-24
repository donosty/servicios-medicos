import { Sequelize } from "sequelize";

const options = {
  dialect: "postgres",
  logging: false,
};

if (process.env.DB_SSL === "true") {
  options.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, options)
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        ...options,
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
      },
    );

export default sequelize;
