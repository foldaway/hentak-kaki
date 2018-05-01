#!/bin/bash

git remote add dokku dokku@$PRODUCTION_HOST:hentak-kaki
git push dokku master
