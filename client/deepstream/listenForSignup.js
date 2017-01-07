const deepstreamServer = process.env.NODE_ENV === 'prod' ? 'deepstream' : 'localhost';
const auth = process.env.NODE_ENV === 'prod' ? {
  role: process.env.DEEPSTREAM_AUTH_ROLE,
  username: process.env.DEEPSTREAM_AUTH_USERNAME,
  password: process.env.DEEPSTREAM_AUTH_PASSWORD } : {};
const client = deepstream(`${deepstreamServer}:6020`).login(auth);
