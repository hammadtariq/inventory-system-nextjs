import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Col, Row } from "antd";
import EditableInventoryCell from "@/components/editableInventoryCell";
import ExportButton from "@/components/exportButton";
import SearchInput from "@/components/SearchInput";
import SelectSearch from "@/components/SelectSearch";
import Spinner from "@/components/spinner";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import { getInventory, searchInventory, updateInventory, useInventory } from "@/hooks/inventory";
import styles from "@/styles/EditableCell.module.css";
import permissionsUtil from "@/utils/permission.util";
import { useCompanies } from "@/hooks/company";
import { DEFAULT_PAGE_LIMIT } from "@/utils/ui.util";

const Inventory = () => {
  const [filters, setFilters] = useState({ itemId: null, companyIds: [] });
  const { inventory, error, isLoading, mutate, paginationHandler } = useInventory(filters);
  const { companies, error: companyError } = useCompanies();
  const [updatedInventory, setUpdatedInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  const canEditItemName = permissionsUtil.checkAuth({
    category: "inventory",
    action: "edit",
  });

  useEffect(() => {
    setUpdatedInventory(inventory);
  }, [inventory]);

  const companyOptions = useMemo(
    () =>
      companies?.rows?.map((company) => ({
        label: company.companyName,
        value: company.id,
      })) || [],
    [companies?.rows]
  );

  const buildColumns = (defaultColumns) =>
    defaultColumns.map((col) =>
      col.editable
        ? {
            ...col,
            onCell: (record) => ({
              record,
              editable: col.editable,
              dataIndex: col.dataIndex,
              title: col.title,
              handleSave,
            }),
          }
        : col
    );

  const defaultColumns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
      editable: canEditItemName,
    },
    {
      title: "Company Name",
      dataIndex: ["company", "companyName"],
      key: "companyName",
    },
    { title: "On Hand", dataIndex: "onHand", key: "onHand" },
    {
      title: "Bale Weight (LBS)",
      dataIndex: "baleWeightLbs",
      key: "baleWeightLbs",
      render: (text) => (text != null ? Number(text).toFixed(2) : "N/A"),
    },
    {
      title: "Bale Weight (KGS)",
      dataIndex: "baleWeightKgs",
      key: "baleWeightKgs",
      render: (text) => (text != null ? Number(text).toFixed(2) : "N/A"),
    },
    {
      title: "Rate per LBS (Rs)",
      dataIndex: "ratePerLbs",
      key: "ratePerLbs",
      render: (text) => (text != null ? Number(text).toFixed(2) : "N/A"),
    },
    {
      title: "Rate per KGS (Rs)",
      dataIndex: "ratePerKgs",
      key: "ratePerKgs",
      render: (text) => (text != null ? Number(text).toFixed(2) : "N/A"),
    },
    {
      title: "Rate per Bale (Rs)",
      dataIndex: "ratePerBale",
      key: "ratePerBale",
    },
  ];

  const columns = canEditItemName ? buildColumns(defaultColumns) : defaultColumns;

  const handleSave = async (row) => {
    setLoading(true);
    try {
      await updateInventory(row.id, { itemName: row.itemName });
      mutate();
    } catch (error) {
      console.log("update inventory item name error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    if (!value) {
      setFilters({ itemId: null });
      paginationHandler(DEFAULT_PAGE_LIMIT, 0, 1);
    } else {
      const searchResults = await searchInventory(value);
      return searchResults;
    }
  };

  const handleSelect = async (id) => {
    const data = await getInventory(id);
    const newInventory = { ...inventory, rows: [data], count: 1 };
    setUpdatedInventory(newInventory);
    return newInventory;
  };

  const handleChange = async (selectedOptions) => {
    const companyIds = selectedOptions.map((option) => option.value);
    setFilters({ companyIds });
    paginationHandler(DEFAULT_PAGE_LIMIT, 0, 1);
  };

  if (error || companyError) return <Alert message={error || companyError} type="error" />;
  return (
    <>
      <AppTitle level={2}>Inventory List</AppTitle>
      <Row justify="space-between" align="middle">
        <Col>
          <SearchInput
            valueKey="itemName"
            valueKey2="company.companyName"
            handleSearch={handleSearch}
            handleSelect={handleSelect}
            placeholder="search inventory"
          />
        </Col>
        <Col>
          <Row justify="end" gutter={[16, 16]}>
            <Col>
              <div className={styles.companyLabel}>
                <label className={styles.labelWidth}>Filter by :</label>
                <SelectSearch
                  placeholder="Company Name"
                  onChange={(value) => handleChange(value)}
                  options={companyOptions}
                />
              </div>
            </Col>
            <Col>
              <ExportButton filename="inventory" filters={filters} />
            </Col>
          </Row>
        </Col>
      </Row>
      <br />
      <br />
      {loading && <Spinner />}
      <AppTable
        isLoading={isLoading}
        rowKey="id"
        columns={columns}
        components={
          canEditItemName
            ? {
                body: {
                  cell: EditableInventoryCell,
                },
              }
            : {}
        }
        rowClassName={styles.editableRow}
        dataSource={updatedInventory ? updatedInventory.rows : []}
        totalCount={updatedInventory ? updatedInventory.count : 0}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default Inventory;
