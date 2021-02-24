
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {

  test("works: not admin", function () {
    const values = sqlForPartialUpdate({name:"Cool Inc", description: "The Coolest Company", numEmployees: 10, logoUrl: "http://images.now/where" },
    {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    }
    );
    expect(values).toEqual({
      setCols: expect.any(String),
      values: expect.any(Array)
    });
  });
});
