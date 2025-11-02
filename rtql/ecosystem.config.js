module.exports = {
  apps: [
    {
      name: "my-next-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",                            
      instances: "max",                         
      exec_mode: "cluster",                     
      env: {
        NODE_ENV: "production",
        PORT: 6677
      }
    }
  ]
};