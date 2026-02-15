import app from "./app";
import { envVars } from "./app/config/env";

const port = envVars.PORT;

const bootsTrap = () => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on ~ 🚀 http://localhost:${port}`);
    });
  } catch (error) {
    console.log("Failed to start server ~ ❌", error);
  }
};

bootsTrap();
