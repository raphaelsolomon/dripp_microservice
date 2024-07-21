RUN on terminal and then set generated key to SENTRY_SECRET_KEY in .env.
    - docker-compose run --rm sentry-base config generate-secret-key

RUN on terminal after the above command completes successfully, to initailize the database
If this is a new database, you'll need to run upgrade.
    - docker-compose run --rm sentry-base upgrade
    
And create an initial user, if you need.

START the service
    - docker-compose up -d    
and open on browser localhost:9000