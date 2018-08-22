# Hentak Kaki
[![CircleCI](https://circleci.com/gh/jurvis/hentak-kaki/tree/master.svg?style=svg&circle-token=46b056b7aa5f749c7d61353f2480639bddd119bc)](https://circleci.com/gh/jurvis/hentak-kaki/tree/master)

This is a bot built to serve NSmen.

## Running
### Database Setup
`$ yarn sequelize db:create`  
`$ yarn sequelize db:migrate`  

If you ever need to reset the database:  
`$ yarn sequelize db:drop`  
`$ yarn sequelize db:create`  

### Actual start
`$ yarn start`

### Scheduler scripts
#### clock.js
This is a script that runs 24/7 (or is at least supposed to) and runs tasks at their required intervals. It does this by scheduling using the Node.JS `cron` library when the script is started.

#### scheduler.js
This is a script that instantly executes all our tasks sequentially, regardless of their timings. This is meant for Heroku Scheduler.
