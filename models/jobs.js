"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ id, title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
          `SELECT id
           FROM jobs
           WHERE id = $1`,
        [id]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${id}`);

    const result = await db.query(
          `INSERT INTO jobs
           (id, title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
        id,
          title,
          salary,
          equity,
          companyHandle,
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - title
   * - minSalary
   * - hasEquity if true, filter to jobs that provide a non-zero amount of equity. 
   *             If false or not included in the filtering, list all jobs regardless of equity.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let queryStr = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs`);
    let wherePart = [];
    let queryValues = [];

  const {title, minSalary, hasEquity } = searchFilters;

  if (title !== undefined) {
    queryValues.push(title);
    wherePart.push(`title ILIKE $${queryValues.length}`);
  }

  if (minSalary !== undefined) {
    queryValues.push(minSalary);
    wherePart.push(`minSalary <= $${queryValues.length}`);
  }

  if (hasEquity) {
    queryValues.push(`%${hasEquity}%`);
    wherePart.push(`equity >= 0`);
  }

  if (wherePart.length > 0) {
    queryStr += " WHERE " + wherePart.join(" AND ");
  }

  // Finalize query and return results

  queryStr += " ORDER BY title";

    const jobRes = await db.query(query, queryValues);
    return jobRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { id, title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
