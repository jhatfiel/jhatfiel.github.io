DIR=$(dirname "$0")
curl -X GET "https://api.collegefootballdata.com/games?year=2023&seasonType=regular" -H  "accept: application/json" -H  "Authorization: Bearer $CFBD_TOKEN" -o $DIR/2023.json