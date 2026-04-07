import React, { useCallback, useEffect, useState } from "react";

import { Alert, Button, Checkbox, Form, Popconfirm, Select, Typography } from "antd";

import EditableCell from "@/components/editableCell";
import AppTable from "@/components/table";
import { useItemsByCompanyIdAndType } from "@/hooks/items";
import styles from "@/styles/EditableCell.module.css";

export default function AddItemsInPo({
  companyId,
  type,
  setData,
  editAll,
  setEditAll,
  data,
  isEdit,
  viewOnly = false,
  removedItems = [],
  setRemovedItems = () => {},
}) {
  const [editingKey, setEditingKey] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectedToRestore, setSelectedToRestore] = useState([]);
  const [form] = Form.useForm();
  const { items, isLoading, error } = useItemsByCompanyIdAndType(companyId, type, isEdit);

  useEffect(() => {
    if (!isEdit) {
      setData(items);
    }
  }, [isEdit, items, setData]);

  const isEditing = (record) => {
    return editingKey.includes(record.key);
  };

  const edit = useCallback(
    (record) => {
      form.setFieldsValue({
        itemName: "",
        noOfBales: 0,
        baleWeightLbs: 0,
        baleWeightKgs: 0,
        ratePerLbs: 0,
        ratePerKgs: 0,
        ...(type === "SMALL_BALES" && { ratePerBale: 0 }),
        ...record,
      });
    },
    [form, type]
  );

  useEffect(() => {
    if (editAll) {
      data?.forEach((record) => {
        edit(record);
        setEditingKey((prev) => {
          return [...prev, record.key];
        });
      });
    }
  }, [data, edit, editAll]);

  const cancel = () => {
    setEditingKey([]);
    setEditAll(false);
  };

  const remove = (record) => {
    const index = data.findIndex((item) => record.id === item.id);
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
    setSelectedRowKeys((prev) => prev.filter((key) => key !== record.id));
    setRemovedItems((prev) => [...prev, record]);
  };

  const removeSelected = () => {
    const removedRecords = data.filter((item) => selectedRowKeys.includes(item.id));
    const newData = data.filter((item) => !selectedRowKeys.includes(item.id));
    setData(newData);
    setSelectedRowKeys([]);
    setSelectAllChecked(false);
    setRemovedItems((prev) => [...prev, ...removedRecords]);
  };

  const applyRestored = () => {
    const itemsToRestore = removedItems.filter((item) => selectedToRestore.includes(item.id));
    const merged = [...data, ...itemsToRestore];
    merged.sort((a, b) => a.itemName.localeCompare(b.itemName));
    setData(merged);
    setRemovedItems((prev) => prev.filter((item) => !selectedToRestore.includes(item.id)));
    setSelectedToRestore([]);
  };

  const saveAll = async () => {
    try {
      const row = await form.validateFields();

      for (const key in row) {
        if (Object.hasOwnProperty.call(row, key)) {
          const item = row[key];
          save(Number(key), item);
        }
      }

      setData(data);
      setEditAll(false);
      setEditingKey([]);
    } catch (error) {
      console.log("Validate Failed:", error);
    }
  };

  const save = async (key, row) => {
    try {
      const newData = [...data];

      const index = newData.findIndex((item) => key === item.id);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        data = newData;
      } else {
        newData.push(row);
        data = newData;
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleSelectAll = (e) => {
    setSelectAllChecked(e.target.checked);
    setSelectedRowKeys(e.target.checked ? data.map((item) => item.id) : []);
  };

  const handleRowSelect = (selected, record) => {
    setSelectedRowKeys((prev) => {
      const updatedSelectedRowKeys = selected ? [...prev, record.id] : prev.filter((key) => key !== record.id);

      if (updatedSelectedRowKeys.length === data.length) {
        setSelectAllChecked(true);
      } else {
        setSelectAllChecked(false);
      }

      return updatedSelectedRowKeys;
    });
  };

  const getOperationColumn = () => {
    return {
      title: "operation",
      dataIndex: "operation",
      width: "8%",
      render: (_, record) => {
        isEditing(record);
        return <Typography.Link onClick={() => remove(record)}>Remove</Typography.Link>;
      },
    };
  };

  const getSelectAllColumn = () => ({
    title: <Checkbox checked={selectAllChecked} onChange={handleSelectAll} disabled={data?.length === 0}></Checkbox>,
    dataIndex: "operation",
    width: "4%",
    render: (_, record) => (
      <div className={styles.centerAlign}>
        <Checkbox
          checked={selectedRowKeys.includes(record.id)}
          onChange={(e) => handleRowSelect(e.target.checked, record)}
        />
      </div>
    ),
  });

  const columns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      width: "18%",
      editable: false,
    },
    {
      title: "No of Bales",
      dataIndex: "noOfBales",
      width: "12%",
      editable: true,
      required: true,
    },
    {
      title: "Bale Weight (LBS)",
      dataIndex: "baleWeightLbs",
      width: "12%",
      editable: true,
      required: false,
    },
    {
      title: "Bale Weight (KGS)",
      dataIndex: "baleWeightKgs",
      width: "12%",
      editable: true,
      required: false,
    },
    {
      title: "Rate per (LBS)",
      dataIndex: "ratePerLbs",
      width: "12%",
      editable: true,
      required: false,
    },
    {
      title: "Rate Per (KGS)",
      dataIndex: "ratePerKgs",
      width: "12%",
      editable: true,
      required: false,
    },
  ];

  if (type === "SMALL_BALES") {
    columns.push({
      title: "Rate Per Bale",
      dataIndex: "ratePerBale",
      width: "10%",
      editable: true,
      required: true,
    });
  }

  if (!viewOnly) {
    columns.unshift(getSelectAllColumn());
    columns.push(getOperationColumn());
  }

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: "number",
        dataIndex: col.dataIndex,
        form,
        title: col.title,
        required: col.required,
        editing: isEditing(record),
      }),
    };
  });

  if (error) return <Alert message={error} type="error" />;

  return (
    <>
      <div className="editAll">
        {viewOnly ? null : (
          <>
            {!editAll ? (
              <Button onClick={() => setEditAll(true)} type="primary" className={styles.marginRight}>
                Edit All
              </Button>
            ) : (
              <>
                <Button className="saveAll" type="primary" onClick={saveAll}>
                  Save All
                </Button>
                <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                  <Button>Cancel</Button>
                </Popconfirm>
              </>
            )}
            <Button onClick={removeSelected} type="danger" disabled={selectedRowKeys.length === 0}>
              Remove Selected
            </Button>
            <Select
              mode="multiple"
              placeholder="Add Removed Items"
              value={selectedToRestore}
              onChange={setSelectedToRestore}
              options={removedItems.map((item) => ({ label: item.itemName, value: item.id }))}
              disabled={removedItems.length === 0}
              style={{ width: 220, marginLeft: 10, marginRight: 10 }}
              maxTagCount={0}
              maxTagPlaceholder={(omitted) => `${omitted.length} item${omitted.length > 1 ? "s" : ""} selected`}
            />
            <Button onClick={applyRestored} disabled={selectedToRestore.length === 0}>
              Apply
            </Button>
          </>
        )}
      </div>

      <Form form={form} component={false}>
        <AppTable
          isLoading={isLoading}
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          dataSource={data ?? []}
          columns={mergedColumns}
          rowClassName={styles.editableRow}
          rowKey="id"
          scroll={{ x: "100%" }}
        />
      </Form>
    </>
  );
}
