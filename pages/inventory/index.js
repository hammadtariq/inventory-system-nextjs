import { useEffect, useRef, useState } from "react";
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
import { getColumnSearchProps } from "@/utils/filter.util";
import permissionsUtil from "@/utils/permission.util";

const Inventory = () => {
  const { inventory, error, isLoading, mutate, paginationHandler, filtersHandler } = useInventory();
  const [updatedInventory, setUpdatedInventory] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [searchedColumn, setSearchedColumn] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState([]);
  const searchInput = useRef(null);

  const canEditItemName = permissionsUtil.checkAuth({
    category: "inventory",
    action: "edit",
  });

  useEffect(() => {
    setUpdatedInventory(inventory);
    if (inventory && companyOptions.length === 0) {
      extractCompanyOptions(inventory);
    }
  }, [companyOptions, inventory]);

  const extractCompanyOptions = (inventory) => {
    const companyOptions = Array.from(new Set(inventory.rows.map((item) => item.company.id))).map((id) => {
      const company = inventory.rows.find((item) => item.company.id === id).company;
      return {
        label: company.companyName,
        value: company.id,
      };
    });
    setCompanyOptions(companyOptions);
  };

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
      ...getColumnSearchProps({
        dataIndex: "companyName",
        dataIndexName: "company name",
        parentDataIndex: "company",
        nested: true,
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
        selectOptions: companyOptions, // Pass the select options here
      }),
    },
    { title: "On Hand", dataIndex: "onHand", key: "onHand" },
    { title: "Bale Weight (LBS)", dataIndex: "baleWeightLbs", key: "baleWeightLbs", render: (text) => text ?? "N/A" },
    { title: "Bale Weight (KGS)", dataIndex: "baleWeightKgs", key: "baleWeightKgs", render: (text) => text ?? "N/A" },
    { title: "Rate per LBS (Rs)", dataIndex: "ratePerLbs", key: "ratePerLbs", render: (text) => text ?? "N/A" },
    { title: "Rate per KGS (Rs)", dataIndex: "ratePerKgs", key: "ratePerKgs", render: (text) => text ?? "N/A" },
    { title: "Rate per Bale (Rs)", dataIndex: "ratePerBale", key: "ratePerBale" },
  ];

  const columns = canEditItemName
    ? defaultColumns.map((col) => {
        if (!col.editable) {
          return col;
        }

        return {
          ...col,
          onCell: (record) => ({
            record,
            editable: col.editable,
            dataIndex: col.dataIndex,
            title: col.title,
            handleSave,
          }),
        };
      })
    : defaultColumns;

  const handleSave = async (row) => {
    setLoading(true);
    try {
      await updateInventory(row.id, { itemName: row.itemName });
      mutate();
    } catch (error) {
      console.log("update inventory item name error", error);
    }
    setLoading(false);
  };

  const handleSearch = async (value) => {
    if (!value) {
      setUpdatedInventory(inventory);
      return inventory;
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

  const handleChange = async (filters) => {
    filtersHandler(filters);
    setFilters(filters);
  };

  if (error) return <Alert message={error} type="error" />;
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
