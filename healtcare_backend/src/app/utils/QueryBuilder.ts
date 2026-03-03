import {
  IQueryConfig,
  IQueryParams,
  IQueryResult,
  PrismaCountArgs,
  PrismaFindManyArgs,
  PrismaModelDelegate,
  PrismaNumberFilter,
  PrismaStringFilter,
  PrsimaWhereConditons,
} from "../interface/query.interface";

export class QueryBuilder<
  T,
  TWhereInput = Record<string, unknown>,
  TInclude = Record<string, unknown>,
> {
  // Properties => define the objects i need
  private query: PrismaFindManyArgs;
  private countQuery: PrismaCountArgs;
  private page: number = 1;
  private limit: number = 10;
  private skip: number = 0;
  private sortBy: string = "createdAt";
  private sortOrder: "asc" | "desc" = "desc";
  private selectFields: Record<string, boolean> | undefined;

  // Constructor => entry point of the class
  constructor(
    private model: PrismaModelDelegate,
    private queryParams: IQueryParams,
    private config: IQueryConfig = {},
  ) {
    // default values
    this.query = {
      include: {},
      where: {},
      orderBy: {},
      skip: 0,
      take: 10,
    };
    this.countQuery = {
      where: {},
    };
  }

  // Search method
  search(): this {
    const { searchTerm } = this.queryParams;
    const { searchableFields } = this.config;

    if (searchTerm && searchableFields && searchableFields.length > 0) {
      const searchConditions = searchableFields.map((field) => {
        if (field.includes(".")) {
          const parts = field.split(".");

          const [relation, nestedField] = parts;

          if (parts.length === 2) {
            const stringFilter: PrismaStringFilter = {
              contains: searchTerm,
              mode: "insensitive" as const,
            };

            return {
              [relation]: {
                [nestedField]: stringFilter,
              },
            };
          } else if (parts.length === 3) {
            const [relation, nestedRelation, nestedField] = parts;

            const stringFilter: PrismaStringFilter = {
              contains: searchTerm,
              mode: "insensitive" as const,
            };

            return {
              [relation]: {
                some: {
                  [nestedRelation]: {
                    [nestedField]: stringFilter,
                  },
                },
              },
            };
          }
        }
        // direct field
        const stringFilter: PrismaStringFilter = {
          contains: searchTerm,
          mode: "insensitive" as const,
        };

        return {
          [field]: stringFilter,
        };
      });

      const whereConditions = this.query.where as PrsimaWhereConditons;

      whereConditions.OR = searchConditions;

      const countConditions = this.countQuery.where as PrsimaWhereConditons;

      countConditions.OR = searchConditions;
    }

    return this;
  }

  // ! filter method
  filter(): this {
    const { filterableFields } = this.config;
    const excludeFields = [
      "searchTerm",
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "fields",
      "include",
    ];

    // collect the filterable fields
    const filterParams: Record<string, unknown> = {};

    Object.keys(this.queryParams).forEach((key) => {
      if (!excludeFields.includes(key)) {
        filterParams[key] = this.queryParams[key];
      }
    });

    const queryWhere = this.query.where as Record<string, unknown>;
    const countQueryWhere = this.countQuery.where as Record<string, unknown>;

    Object.keys(filterParams).forEach((key) => {
      const value = filterParams[key];

      if (value === undefined && value === null) {
        return;
      }

      // check if the field is allowed to filter
      const isAllowedFileds =
        !filterableFields ||
        filterableFields.length === 0 ||
        filterableFields.includes(key);

      if (!isAllowedFileds) {
        return;
      }

      // handle nested fields
      if (key.includes(".")) {
        const parts = key.split(".");

        if (parts.length === 2) {
          const [relation, nestedField] = parts;

          const queryWhere = this.query.where as Record<string, unknown>;
          const countQueryWhere = this.countQuery.where as Record<
            string,
            unknown
          >;

          if (!queryWhere[relation]) {
            queryWhere[relation] = {};
            countQueryWhere[relation] = {};
          }

          const queryRelation = queryWhere[relation] as Record<string, unknown>;
          const countQueryRelation = countQueryWhere[relation] as Record<
            string,
            unknown
          >;

          queryRelation[nestedField] = this.parseFilterValue(value);
          countQueryRelation[nestedField] = this.parseFilterValue(value);

          return;
        }

        if (parts.length === 3) {
          const [relation, nestedRelation, nestedField] = parts;

          if (!queryWhere[relation]) {
            queryWhere[relation] = {
              some: {},
            };
            countQueryWhere[relation] = {
              some: {},
            };
          }

          const queryRelation = queryWhere[relation] as Record<string, unknown>;
          const countQueryRelation = countQueryWhere[relation] as Record<
            string,
            unknown
          >;

          if (!queryRelation.some) {
            queryRelation.some = {};
            countQueryRelation.some = {};
          }

          const querySome = queryRelation.some as Record<string, unknown>;
          const countQuerySome = countQueryRelation.some as Record<
            string,
            unknown
          >;

          if (!querySome[nestedRelation]) {
            querySome[nestedRelation] = {};
            countQuerySome[nestedRelation] = {};
          }

          const queryNestedRelation = querySome[nestedRelation] as Record<
            string,
            unknown
          >;
          const countQueryNestedRelation = countQuerySome[
            nestedRelation
          ] as Record<string, unknown>;

          queryNestedRelation[nestedField] = this.parseFilterValue(value);
          countQueryNestedRelation[nestedField] = this.parseFilterValue(value);

          return;
        }
      }

      // range filter parsing
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        queryWhere[key] = this.parseRangeFilterValue(
          value as Record<string, string | number>,
        );
        countQueryWhere[key] = this.parseRangeFilterValue(
          value as Record<string, string | number>,
        );

        return;
      }

      // direct value parsing
      queryWhere[key] = this.parseFilterValue(value);
      countQueryWhere[key] = this.parseFilterValue(value);
    });

    return this;
  }

  // paginations method
  pagination(): this {
    const page = Number(this.queryParams.page) || 1;
    const limit = Number(this.queryParams.limit) || 10;

    this.page = page;
    this.limit = limit;
    this.skip = (page - 1) * limit;

    this.query.skip = this.skip;
    this.query.take = this.limit;

    return this;
  }

  // sort method
  sort(): this {
    const sortBy = this.queryParams.sortBy || "createdAt";
    const sortOrder = this.queryParams.sortOrder || "desc";

    this.sortBy = sortBy;
    this.sortOrder = sortOrder;

    if (sortBy.includes(".")) {
      const parts = sortBy.split(".");

      if (parts.length === 2) {
        const [relation, nestedField] = parts;

        this.query.orderBy = {
          [relation]: {
            [nestedField]: sortOrder,
          },
        };

        return this;
      }

      if (parts.length === 3) {
        const [relation, nestedRelation, nestedField] = parts;

        this.query.orderBy = {
          [relation]: {
            [nestedRelation]: {
              [nestedField]: sortOrder,
            },
          },
        };

        return this;
      }
    } else {
      this.query.orderBy = {
        [sortBy]: sortOrder,
      };
    }

    return this;
  }

  // ! fields method
  fields(): this {
    const fieldsParam = this.queryParams.fields;

    if (fieldsParam && typeof fieldsParam === "string") {
      const fieldsArray = fieldsParam.split(",").map((field) => field.trim());

      this.selectFields = {};

      fieldsArray.forEach((field) => {
        if (this.selectFields) {
          this.selectFields[field] = true;
        }
      });

      this.query.select = this.selectFields as Record<
        string,
        boolean | Record<string, unknown>
      >;

      delete this.query.include;
    }

    return this;
  }

  // ! include method
  include(relation: TInclude): this {
    if (this.selectFields) {
      return this;
    }

    this.query.include = {
      ...(this.query.include as Record<string, unknown>),
      ...(relation as Record<string, unknown>),
    };

    return this;
  }

  // ! dynamic include
  dynamicInclude(
    includeConfig: Record<string, unknown>,
    defaultInclude?: string[],
  ): this {
    if (this.selectFields) {
      return this;
    }

    const result: Record<string, unknown> = {};

    defaultInclude?.forEach((filed) => {
      if (includeConfig[filed]) {
        result[filed] = includeConfig[filed];
      }
    });

    const includeParams = this.queryParams.include as string | undefined;

    if (includeParams && typeof includeParams === "string") {
      const requestedRelation = includeParams
        .split(",")
        .map((field) => field.trim());

      requestedRelation.forEach((relation) => {
        if (includeConfig[relation]) {
          result[relation] = includeConfig[relation];
        }
      });
    }
    this.query.include = {
      ...(this.query.include as Record<string, unknown>),
      ...result,
    };

    return this;
  }

  // ! where method
  where(conditions: TWhereInput): this {
    this.query.where = this.deepMarge(
      this.query.where as Record<string, unknown>,
      conditions as Record<string, unknown>,
    );
    this.countQuery.where = this.deepMarge(
      this.countQuery.where as Record<string, unknown>,
      conditions as Record<string, unknown>,
    );
    return this;
  }

  // count
  async count(): Promise<number> {
    return await this.model.count(
      this.countQuery as Parameters<typeof this.model.count>[0],
    );
  }

  // ! execute
  async execute(): Promise<IQueryResult<T>> {
    const [total, data] = await Promise.all([
      this.model.count(
        this.countQuery as Parameters<typeof this.model.count>[0],
      ),
      this.model.findMany(
        this.query as Parameters<typeof this.model.findMany>[0],
      ),
    ]);

    const totalPages = Math.ceil(total / this.limit);

    return {
      data: data as T[],
      meta: {
        page: this.page,
        limit: this.limit,
        total,
        totalPages,
      },
    };
  }

  // get query
  getQuery(): PrismaFindManyArgs {
    return this.query;
  }

  // parse filter value
  private parseFilterValue(value: unknown): unknown {
    if (value === true) {
      return true;
    }

    if (value === false) {
      return false;
    }

    if (typeof value === "string" && value !== "" && !isNaN(Number(value))) {
      return Number(value);
    }

    if (Array.isArray(value)) {
      return { in: value.map((item) => this.parseFilterValue(item)) };
    }

    return value;
  }

  // parse range filter value
  private parseRangeFilterValue(
    value: Record<string, string | number>,
  ): PrismaNumberFilter | PrismaStringFilter | Record<string, unknown> {
    const rangeQuery: Record<string, string | number | (string | number)[]> =
      {};

    Object.keys(value).forEach((operator) => {
      const operatorValue = value[operator];

      const parsedValue: string | number =
        typeof operatorValue === "string" && !isNaN(Number(operatorValue))
          ? Number(operatorValue)
          : operatorValue;

      switch (operator) {
        case "lt":
        case "lte":
        case "gt":
        case "gte":
        case "equals":
        case "not":
        case "contains":
        case "startsWith":
        case "endsWith":
          rangeQuery[operator] = parsedValue;
          break;

        case "in":
        case "notIn":
          if (Array.isArray(operatorValue)) {
            rangeQuery[operator] = operatorValue;
          } else {
            rangeQuery[operator] = parsedValue;
          }
          break;

        default:
          break;
      }
    });

    return Object.keys(rangeQuery).length > 0 ? rangeQuery : value;
  }

  // ! for where
  private deepMarge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (
          result[key] &&
          typeof result[key] === "object" &&
          !Array.isArray(result[key])
        ) {
          const resultKey = this.deepMarge(
            result[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>,
          );
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}
