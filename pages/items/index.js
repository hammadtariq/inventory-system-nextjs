import { useRef, useState, useEffect } from "react";

import { Alert, Button, Popconfirm, Row, Col, message } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import EditableInventoryCell from "@/components/editableInventoryCell";

import AppCreateButton from "@/components/createButton";
import AppTable from "@/components/table";
import AppTitle from "@/components/title";
import { deleteItem, useItems, searchItems, updateItem, getAllItemListbyCompany } from "@/hooks/items";
import styles from "@/styles/Item.module.css";
import { getColumnSearchProps } from "@/utils/filter.util";
import permissionsUtil from "@/utils/permission.util";
import { DATE_TIME_FORMAT } from "@/utils/ui.util";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import SearchInput from "@/components/SearchInput";

const Items = () => {
  const { items, error, isLoading, paginationHandler, mutate } = useItems();
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [updatedItemList, setUpdatedItemList] = useState();

  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUpdatedItemList(items);
  }, [items]);

  const canDelete = permissionsUtil.checkAuth({
    category: "item",
    action: "delete",
  });

  const canEdit = permissionsUtil.checkAuth({
    category: "item",
    action: "edit",
  });

  const renderActions = (text) => (
    <>
      <Popconfirm
        title="Are you sure?"
        onConfirm={async () => {
          await deleteItem(text.id);
          mutate(null);
        }}
        okText="Yes"
        cancelText="No"
        disabled={!canDelete}
      >
        <Button className={styles.deleteBtn} icon={<DeleteOutlined />} danger disabled={!canDelete}>
          Delete
        </Button>
      </Popconfirm>
      <Button
        onClick={() => router.push(`/items/${text.id}`)}
        className={styles.editBtn}
        icon={<EditOutlined />}
        disabled={!canEdit}
      >
        Edit
      </Button>
    </>
  );

  const canEditItemName = permissionsUtil.checkAuth({
    category: "item",
    action: "edit",
  });

  const defaultColumns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      editable: canEditItemName,
      ...getColumnSearchProps({
        dataIndex: "itemName",
        searchInput,
        searchText,
        searchedColumn,
        setSearchText,
        setSearchedColumn,
        dataIndexName: "item name",
      }),
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
      }),
    },
    {
      title: "Type",
      dataIndex: "type",
      filters: [
        {
          text: "BIG_BALES",
          value: "BIG_BALES",
        },
        {
          text: "SMALL_BALES",
          value: "SMALL_BALES",
        },
      ],
      onFilter: (value, record) => record.type.indexOf(value) === 0,
    },
    {
      title: "Rate per LBS (Rs)",
      dataIndex: "ratePerLbs",
      render: (text) => text ?? "N/A",
    },
    {
      title: "Rate per KGS (Rs)",
      dataIndex: "ratePerKgs",
      render: (text) => text ?? "N/A",
    },
    {
      title: "Rate per Bale (Rs)",
      dataIndex: "ratePerBale",
      render: (text) => text ?? "N/A",
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      render: (text) => dayjs(text).format(DATE_TIME_FORMAT),
    },
    {
      title: "Action",
      key: "action",
      render: renderActions,
    },
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
      await updateItem(row.id, { itemName: row.itemName });
      mutate();
      message.success("item modified successfully");
    } catch (error) {
      console.log("update itemList item name error", error);
    }
    setLoading(false);
  };
  const handleSearch = async (value) => {
    if (!value) {
      setUpdatedItemList(updatedItemList);
      return updatedItemList;
    } else {
      const searchResults = await searchItems(value);
      return searchResults;
    }
  };

  const handleSelect = async (companyId) => {
    const newItems = await getAllItemListbyCompany(companyId);
    setUpdatedItemList(newItems);
    return newItems;
  };

  if (error) return <Alert message={error} type="error" />;
  return (
    <>
      <AppTitle level={2}>
        Items List
        <Row justify="space-between">
          <Col>
            <SearchInput
              valueKey="companyName"
              handleSearch={handleSearch}
              handleSelect={handleSelect}
              placeholder="search company"
            />
          </Col>
          <Col>
            <AppCreateButton url="/items/create" />
          </Col>
        </Row>
      </AppTitle>
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
        dataSource={updatedItemList ? updatedItemList.rows : []}
        totalCount={updatedItemList ? updatedItemList.count : 0}
        pagination={true}
        paginationHandler={paginationHandler}
      />
    </>
  );
};

export default Items;
