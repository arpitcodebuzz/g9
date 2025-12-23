
import knex from "knex";
import { attachPaginate } from "knex-paginate";
import config from "../../../knexfile";

attachPaginate();
export default knex(config);
