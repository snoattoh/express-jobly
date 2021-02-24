"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    id: "100",
    title: "New",
    salary: 40000,
    equity: 4000,
    company_handle: "c1",
  };
  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = '100'`);
    expect(result.rows).toEqual([
      {
        id: "100",
        title: "New",
        salary: 40000,
        equity: 4000,
        company_handle: "c1",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: "j1",
        title: "t1",
        salary: 10000,
        equity: 1000,
        company_handle: "c1",
      },
      {
        id: "j2",
        title: "t2",
        salary: 20000,
        equity: 2000,
        company_handle: "c2",
      },
      {
        id: "j3",
        title: "t3",
        salary: 30000,
        equity: 3000,
        company_handle: "c3",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("j1");
    expect(job).toEqual({
      id: "j1",
      title: "t1",
      salary: 10000,
      equity: 1000,
      company_handle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 100000,
    equity: 10000,
    company_handle: "c2",
  };

  test("works", async function () {
    let job = await Job.update("j1", updateData);
    expect(job).toEqual({
      id: "j1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 'j1'`);
    expect(result.rows).toEqual([{
      id: "j1",
      title: "New",
      salary: 100000,
      equity: 10000,
      company_handle: "c2",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
      company_handle: "c2",
  };

    let company = await Job.update("j1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "j1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
           `SELECT id, title, salary, equity, company_handle
           FROM jobs
          WHERE id = 'j1'`);
    expect(result.rows).toEqual([{
      id: "j1",
      title: "New",
      salary: null,
      equity: null,
      company_handle: "c2",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("j1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("c1");
    const res = await db.query(
        "SELECT id FROM jobs WHERE id='j1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
