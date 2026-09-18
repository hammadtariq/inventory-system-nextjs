"use strict";

async function getCompanyNameUniqueIndexName(queryInterface) {
  const indexes = await queryInterface.showIndex("companies");
  const index = indexes.find(
    (item) => item.unique && item.fields?.length === 1 && item.fields[0].attribute === "companyName"
  );
  return index ? index.name : null;
}

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_companyName_key";'
    );

    const uniqueIndexName = await getCompanyNameUniqueIndexName(queryInterface);

    if (uniqueIndexName) {
      await queryInterface.removeIndex("companies", uniqueIndexName);
    }

    await queryInterface.addIndex("companies", ["organizationId", "companyName"], {
      unique: true,
      name: "companies_organization_id_company_name_unique",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("companies", "companies_organization_id_company_name_unique");

    await queryInterface.addConstraint("companies", {
      fields: ["companyName"],
      type: "unique",
      name: "companies_companyName_key",
    });
  },
};
