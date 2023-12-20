# threeJS-nodeJS

### 1. Install all the dependencies by 
`npm i` or `yarn add`

### 2. make a copy of config files inside of `config` directory
make a copy of `config/development-copy.json` and named it `config/development.json`

make a copy of `config/production-copy.json` and named it `config/production.json`

### 3. run the project in the development mode by this command
    npm run dev

if you want to run it in the production mode you must execute this code
    
    npm run prod
* for running it in the production mode you need to install `pm2` first 

#### 4. open this url in your browser
    http://localhost:3200/
* you can change the `port`, just edit it in the `config/development.json` file