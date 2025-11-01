module.exports = {
  apps: [
    {
      name: "my-next-app",
      script: "node_modules/next/dist/bin/next", // Direct path to the next executable
      args: "start",                             // The command argument
      instances: "max",                          // Use max CPU cores (Cluster Mode)
      exec_mode: "cluster",                      // Recommended for performance
      env: {
        NODE_ENV: "production",
        PORT: 6677 // Or your desired port
      }
    }
  ]
};