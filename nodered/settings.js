module.exports = {
  flowFile: 'flows.json',
  userDir: '/data',
  httpNodeCors: {
    origin: [
      'http://localhost:4200', 'http://127.0.0.1:4200',
      'http://localhost:4201', 'http://127.0.0.1:4201',
      'http://localhost:4300', 'http://127.0.0.1:4300',
      'http://localhost:8100', 'http://127.0.0.1:8100'
    ],
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization'
  }
};
