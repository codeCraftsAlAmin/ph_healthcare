import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seed";
import { Server } from "http";

const port = envVars.PORT;
let server: Server;

const bootsTrap = async () => {
  try {
    await seedSuperAdmin();
    server = app.listen(port, () => {
      console.log(`Server is running on ~ 🚀 http://localhost:${port}`);
    });
  } catch (error) {
    console.log("Failed to start server ~ ❌", error);
  }
};

// SIGTERM signal handler
process.on("SIGTERM", () => {
  console.log("Server is closing ~ 🚨");
  if (server) {
    server.close(() => {
      console.log("Server closed ~ 🚨");
      process.exit(1);
    });
  }
  process.exit(1);
});

// SIGINT signal handler
process.on("SIGINT", () => {
  console.log("Server is closing ~ 🚨");
  if (server) {
    server.close(() => {
      console.log("Server closed ~ 🚨");
      process.exit(1);
    });
  }
  process.exit(1);
});

//uncaught exception handler
process.on("uncaughtException", (error) => {
  console.log("Uncaught Exception ~ ❌", error);
  if (server) {
    server.close(() => {
      console.log("Server closed ~ 🚨");
      process.exit(1);
    });
  }

  process.exit(1);
});

//unhandled rejection handler
process.on("unhandledRejection", (reason) => {
  console.log("Unhandled Rejection ~ ❌", reason);
  if (server) {
    server.close(() => {
      console.log("Server closed ~ 🚨");
      process.exit(1);
    });
  }

  process.exit(1);
});

bootsTrap();
