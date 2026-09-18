import Sequelize, { Model } from "sequelize";

import TenantContext from "@/lib/tenant-context";
import { applyTenantWriteHooks } from "@/lib/tenant-write-hooks";

describe("applyTenantWriteHooks", () => {
  function createModelMock() {
    const hooks = {};
    return {
      hooks,
      rawAttributes: {
        organizationId: {},
      },
      addHook: jest.fn((name, fn) => {
        hooks[name] = fn;
      }),
    };
  }

  it("adds organizationId to read queries when tenant context exists", async () => {
    const Model = createModelMock();
    applyTenantWriteHooks(Model);

    const options = { where: { id: 5 } };

    await TenantContext.run(23, async () => {
      Model.hooks.beforeFind(options);
    });

    expect(options.where).toEqual({ id: 5, organizationId: 23 });
  });

  it("throws for read queries without tenant context", () => {
    const Model = createModelMock();
    applyTenantWriteHooks(Model);

    expect(() => Model.hooks.beforeFind({ where: { id: 5 } })).toThrow("TenantContext not set");
  });

  it("sets organizationId on create when tenant context exists", async () => {
    const Model = createModelMock();
    applyTenantWriteHooks(Model);

    const instance = {};

    await TenantContext.run(23, async () => {
      Model.hooks.beforeCreate(instance, {});
    });

    expect(instance.organizationId).toBe(23);
  });

  it("sets organizationId on bulk create when tenant context exists", async () => {
    const Model = createModelMock();
    applyTenantWriteHooks(Model);

    const instances = [{}, {}];

    await TenantContext.run(23, async () => {
      Model.hooks.beforeBulkCreate(instances, {});
    });

    expect(instances).toEqual([{ organizationId: 23 }, { organizationId: 23 }]);
  });

  it("does not set organizationId when tenantBypass is enabled", async () => {
    const Model = createModelMock();
    applyTenantWriteHooks(Model);

    const instance = {};

    await TenantContext.run(23, async () => {
      Model.hooks.beforeCreate(instance, { tenantBypass: true });
    });

    expect(instance).toEqual({});
  });
});

describe("tenant write hooks", () => {
  let sequelize;
  let TenantRecord;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });

    class Record extends Model {}
    Record.init(
      {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        organizationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      },
      { sequelize, modelName: "tenantRecord" }
    );

    TenantRecord = Record;
    applyTenantWriteHooks(TenantRecord);
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("stamps organizationId before not-null validation runs", async () => {
    const record = await TenantContext.run(42, () => TenantRecord.create({ name: "purchase" }));

    expect(record.organizationId).toBe(42);
  });

  it("rejects cross-tenant creates before validation", async () => {
    await expect(
      TenantContext.run(42, () => TenantRecord.create({ name: "purchase", organizationId: 7 }))
    ).rejects.toThrow("Cross-tenant create attempted");
  });
});
