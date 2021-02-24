const { BadRequestError } = require("../expressError");

/*
sqlForPartialUpdate: Converts data and a json to a sql query.

dataToUpdate: The Json data received from the request
jsontoSql: the json or Object representation are keys for the SQL reprresentation

Returns
{setCols: the values for the SET clause of the update query
 values: the values listed for the WHERE clause of the update query}
 
*/
function sqlForPartialUpdate(dataToUpdate, jsonToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsonToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
