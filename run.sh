while read -r i; do
  # echo   "$i"

node ./probar2.js $i

done < data.csv