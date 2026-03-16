import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seed";

const port = envVars.PORT;

const bootsTrap = async () => {
  try {
    await seedSuperAdmin();
    app.listen(port, () => {
      console.log(`Server is running on ~ 🚀 http://localhost:${port}`);
    });
  } catch (error) {
    console.log("Failed to start server ~ ❌", error);
  }
};

bootsTrap();
