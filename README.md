Setup a .env file in the woofpoint-server folder along with the followind credentials

You need to create two files .env files
- `.env.development` = for development purpose
- `.env.production` = for actual server in EC2


``` bash
MONGODB_URI=""
JWT_SECRET=""
PORT = 3001
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
AWS_S3_BUCKET_NAME=""
```

When you deploy your code in main app server. Keep this in mind
- I should manually and securely put up the .env credentials file on the server in the project's root folder.
- When installing dependencies in server `npm install --omit=dev`, this will skip `cross-env` and `ts-node-dev`.
- Then run `npm start` on the server. This will build the code and start the server. 
